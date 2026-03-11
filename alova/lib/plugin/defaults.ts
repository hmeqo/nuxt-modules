/// <reference types="node" />

import { createPlugin } from '@alova/wormhole/plugin'
import fs from 'node:fs'
import path from 'node:path'
import type { OpenAPIV3 } from 'openapi-types'
import {
  defaultFnName,
  fullFnName,
  getRefName,
  getTypeName,
  initFnName,
  isRef,
  isSchemaObject,
  resolveSchemaVariants,
  type OpenAPISchema,
  type OpenAPISchemaObject,
  type OpenAPISchemas,
} from '../util/openapi'

// ─── 插件配置 ─────────────────────────────────────────────────────────────────

export interface DefaultsPluginOpts {
  /** 过滤不需要生成的 schema */
  filter?: (name: string, schema: OpenAPISchema) => boolean
  /** 自定义某个字段的默认值表达式 */
  customDefaultExpr?: (key: string, schema: OpenAPISchemaObject) => string | undefined
  /** 标记为文件类型的字段名（生成 new Blob([])） */
  fileFieldNames?: string[]
}

// ─── 运行时帮助代码（注入到生成文件头部）────────────────────────────────────

/**
 * 注入到生成 defaults 文件中的运行时辅助代码
 *
 * 生成两类函数：
 * - `fullXxx(opts?)` — 包含所有字段（required + optional），对应 `DeepRequired<T>`
 *   - `fullXxx()` → DeepRequired<T>（nullable 字段为 null）
 *   - `fullXxx({ notNull: true })` → DeepRequired<T>（nullable 字段为真实值，无 null）
 * - `initXxx()` — 按 schema 正常生成字段默认值，返回 T：
 *   - optional 字段（允许 undefined）→ 不生成
 *   - nullable 字段 → null
 *   - required 非 nullable 字段 → 按类型生成默认值
 *   主要用于 pickXxx 补全缺失字段，以及作为表单初始值
 */
const runtimeHelperCode = (extraImports: string) => `/* eslint-disable @typescript-eslint/no-explicit-any */
import type Types from './globals'
${extraImports}
export type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: T[K] extends (infer U)[] ? DeepRequired<U>[] : T[K] extends object ? DeepRequired<T[K]> : T[K] }
  : T

export type DeepNotNull<T> = T extends object
  ? { [K in keyof T]-?: T[K] extends (infer U)[] ? DeepNotNull<U>[] : T[K] extends object ? DeepNotNull<T[K]> : NonNullable<T[K]> }
  : NonNullable<T>

const defineFull = <T>(
  fields: (notNull: boolean) => DeepRequired<T>,
) => {
  function def(): DeepRequired<T>
  function def(override: Partial<DeepRequired<T>>): DeepRequired<T>
  function def(opts: { notNull: true; override?: Partial<DeepNotNull<T>> }): DeepNotNull<T>
  function def(opts: { notNull?: false; override?: Partial<DeepRequired<T>> }): DeepRequired<T>
  function def(arg?: any): any {
    if (arg == null || typeof arg !== 'object') {
      return fields(false)
    }
    if (!('notNull' in arg)) {
      return { ...fields(false), ...arg }
    }
    const { notNull = false, override } = arg
    return { ...fields(notNull), ...override }
  }
  return def
}

const defineInit = <T>(
  fields: () => T,
) => {
  return (override?: Partial<T>): T => ({ ...fields(), ...override })
}
`

// ─── 层 1：基础值生成（原始类型 → 字面量表达式）──────────────────────────────

/**
 * 判断 schema 是否可能为 null（nullable 字段）
 */
const isNullable = (schema: OpenAPISchemaObject): boolean =>
  !!(
    (schema as OpenAPIV3.SchemaObject).nullable ||
    (Array.isArray(schema.type) ? schema.type.includes('null') : schema.type === 'null') ||
    schema.oneOf?.some((v) => isSchemaObject(v) && v.type === 'null') ||
    schema.anyOf?.some((v) => isSchemaObject(v) && v.type === 'null')
  )

/**
 * 生成非 null 情况下的真实默认值表达式（忽略 nullable 判断，只看类型）
 */
const getNonNullExpr = (fieldName: string, schema: OpenAPISchemaObject, ctx: FieldGenContext): string => {
  const { opts } = ctx
  if (opts?.customDefaultExpr) {
    const custom = opts.customDefaultExpr(fieldName, schema)
    if (custom !== undefined) return custom
  }

  if (schema.default !== undefined) return JSON.stringify(schema.default)
  if (opts?.fileFieldNames?.includes(fieldName) || schema.format === 'binary') return 'new Blob([])'
  if (schema.enum?.length) return JSON.stringify(schema.enum[0])

  // 提取非 null 的实际类型（处理联合类型如 string | null）
  const effectiveType = Array.isArray(schema.type)
    ? (schema.type.find((t) => t !== 'null') ?? schema.type[0])
    : schema.type

  switch (effectiveType) {
    case 'string':
      switch (schema.format) {
        case 'date-time':
          return 'new Date().toISOString()'
        case 'date':
          ctx.requiredUtils.add('dateString')
          return 'dateString()'
        case 'time':
          ctx.requiredUtils.add('timeString')
          return 'timeString()'
        case 'uuid':
          return 'crypto.randomUUID()'
        default:
          return "''"
      }
    case 'number':
    case 'integer':
      return schema.format === 'unix-time' ? 'Date.now()' : '0'
    case 'boolean':
      return 'false'
    case 'array':
      return '[]'
    case 'object':
      return '{}'
    default:
      return "''"
  }
}

/**
 * 生成字段的默认值表达式
 *
 * - nullable 字段：生成 `notNull ? <nonNullValue> : null`（运行时根据 notNull 决定）
 * - 其他字段：直接返回固定值
 */
const getPrimitiveDefaultExpr = (fieldName: string, schema: OpenAPISchemaObject, ctx: FieldGenContext): string => {
  const { opts } = ctx
  if (opts?.customDefaultExpr) {
    const custom = opts.customDefaultExpr(fieldName, schema)
    if (custom !== undefined) return custom
  }
  if (schema.default !== undefined) return JSON.stringify(schema.default)

  if (isNullable(schema)) {
    const nonNullVal = getNonNullExpr(fieldName, schema, ctx)
    return `notNull ? ${nonNullVal} : null`
  }

  return getNonNullExpr(fieldName, schema, ctx)
}

// ─── 层 2：字段值表达式生成（Schema → 代码表达式）────────────────────────────

interface FieldGenContext {
  opts?: DefaultsPluginOpts
  /** 已注册为简单数据类型的 schema 名（enum / integer alias），不需要 notNull 参数 */
  dataTypeNames: string[]
  requiredUtils: Set<'dateString' | 'timeString'>
}

/**
 * 生成内联 object（schema.type === 'object' 且有 properties）的字面量表达式
 * 内联嵌套时递归处理，不产生独立的 defineFull 函数
 */
const buildInlineObjectExpr = (schema: OpenAPISchemaObject, ctx: FieldGenContext, indent: number): string => {
  const properties = schema.properties ?? {}
  if (Object.keys(properties).length === 0) return '{}'

  const pad = ' '.repeat(indent)
  const innerPad = ' '.repeat(indent + 2)
  const lines: string[] = []

  for (const [key, prop] of Object.entries(properties)) {
    lines.push(`${innerPad}${key}: ${buildFieldExpr(key, prop, ctx, indent + 2)}`)
  }

  return `{\n${lines.join(',\n')}\n${pad}}`
}

/**
 * 生成单个字段的默认值表达式
 * - $ref → 调用对应的 fullXxx 函数，传入 notNull
 * - allOf/anyOf/oneOf → 取第一个非 null 变体递归
 * - 内联 object（有 properties）→ 展开字面量
 * - 其他 → 原始值（nullable 字段生成条件表达式）
 */
const buildFieldExpr = (fieldName: string, schema: OpenAPISchema, ctx: FieldGenContext, indent = 4): string => {
  if (isRef(schema)) {
    const refName = getRefName(schema.$ref)
    if (ctx.dataTypeNames.includes(refName)) return `${defaultFnName(refName)}()`
    // 使用条件表达式确保 TS 能正确推断各分支的返回类型
    return `notNull ? ${fullFnName(refName)}({ notNull: true }) : ${fullFnName(refName)}()`
  }

  if (!isSchemaObject(schema)) return 'undefined'

  // allOf/anyOf/oneOf：取第一个非 null 类型变体递归处理
  const nonNullOf = (schema.allOf ?? schema.anyOf ?? schema.oneOf)?.find(
    (v) => !(isSchemaObject(v) && v.type === 'null'),
  )
  if (nonNullOf) return buildFieldExpr(fieldName, nonNullOf, ctx, indent)

  if (schema.enum?.length) return JSON.stringify(schema.enum[0])

  // 内联 object（有具名属性）：展开字面量
  if (schema.type === 'object' && schema.properties && Object.keys(schema.properties).length > 0) {
    return buildInlineObjectExpr(schema, ctx, indent)
  }

  if (schema.type === 'array') return '[]'

  return getPrimitiveDefaultExpr(fieldName, schema, ctx)
}

// ─── 层 3：Generate 函数代码构建 ──────────────────────────────────────────────

/**
 * 为一个 object schema 构建 defineFull(...) 函数代码
 * 生成**所有**字段（包括 optional），确保返回值中不含 undefined
 * - nullable 字段根据 notNull 参数决定是否为 null
 */
const buildObjectDefaultFn = (name: string, schema: OpenAPISchemaObject, ctx: FieldGenContext): string => {
  const fieldLines: string[] = []

  for (const [fieldName, prop] of Object.entries(schema.properties ?? schema.additionalProperties ?? {})) {
    fieldLines.push(`${fieldName}: ${buildFieldExpr(fieldName, prop, ctx)}`)
  }

  return `
export const ${fullFnName(name)} = defineFull<Types.${getTypeName(name)}>(
  (notNull) => ({
${fieldLines.map((l) => `    ${l}`).join(',\n')}
  })
)
`
}

/**
 * 为一个 object schema 构建 defineInit(...) 函数代码
 *
 * 按 schema 正常生成字段默认值，返回 T：
 * - optional 字段（不在 required 数组中，允许 undefined）→ 不生成
 * - nullable 字段 → null
 * - required 非 nullable 字段 → 按类型生成默认值（$ref → 调用 fullXxx()，原始类型 → 字面量）
 *
 * 主要用于 pickXxx 补全缺失字段，以及作为表单初始值
 */
const buildObjectPartialFn = (name: string, schema: OpenAPISchemaObject, ctx: FieldGenContext): string => {
  const required = new Set<string>(schema.required ?? [])
  const fieldLines: string[] = []

  for (const [fieldName, prop] of Object.entries(schema.properties ?? {})) {
    // optional 字段（不在 required 中）跳过，允许 undefined
    if (!required.has(fieldName)) continue

    fieldLines.push(`${fieldName}: ${buildPartialFieldExpr(fieldName, prop, ctx)}`)
  }

  return `
export const ${initFnName(name)} = defineInit<Types.${getTypeName(name)}>(
  () => ({
${fieldLines.map((l) => `    ${l}`).join(',\n')}
  })
)
`
}

/**
 * 为 partial 场景生成单个字段的默认值表达式（无 notNull 参数）
 * - $ref → 直接调用 initXxx()
 * - allOf/anyOf/oneOf → 取第一个非 null 变体递归
 * - 内联 object（有 properties）→ 展开字面量（只包含 required 的子字段）
 * - nullable → null
 * - 其他 → 按类型生成默认值
 */
const buildPartialFieldExpr = (fieldName: string, schema: OpenAPISchema, ctx: FieldGenContext, indent = 4): string => {
  if (isRef(schema)) {
    const refName = getRefName(schema.$ref)
    // 直接调用 initXxx()
    return ctx.dataTypeNames.includes(refName) ? `${defaultFnName(refName)}()` : `${initFnName(refName)}()`
  }

  if (!isSchemaObject(schema)) return 'undefined'

  // allOf/anyOf/oneOf：取第一个非 null 变体递归
  const nonNullVariant = (schema.allOf ?? schema.anyOf ?? schema.oneOf)?.find(
    (v) => !(isSchemaObject(v) && v.type === 'null'),
  )
  if (nonNullVariant) return buildPartialFieldExpr(fieldName, nonNullVariant, ctx, indent)

  if (schema.enum?.length) return JSON.stringify(schema.enum[0])

  // nullable → null
  if (isNullable(schema)) return 'null'

  // 内联 object（有具名属性）→ 只展开 required 子字段
  if (schema.type === 'object' && schema.properties && Object.keys(schema.properties).length > 0) {
    return buildPartialInlineObjectExpr(schema, ctx, indent)
  }

  if (schema.type === 'array') return '[]'

  return getNonNullExpr(fieldName, schema, ctx)
}

/**
 * 为 partial 场景生成内联 object 的字面量表达式
 * 只包含 required 的子字段（optional 子字段跳过）
 */
const buildPartialInlineObjectExpr = (schema: OpenAPISchemaObject, ctx: FieldGenContext, indent: number): string => {
  const properties = schema.properties ?? {}
  const required = new Set<string>(schema.required ?? [])

  if (Object.keys(properties).length === 0) return '{}'

  const pad = ' '.repeat(indent)
  const innerPad = ' '.repeat(indent + 2)
  const lines: string[] = []

  for (const [key, prop] of Object.entries(properties)) {
    if (!required.has(key)) continue
    lines.push(`${innerPad}${key}: ${buildPartialFieldExpr(key, prop, ctx, indent + 2)}`)
  }

  if (lines.length === 0) return '{}'
  return `{\n${lines.join(',\n')}\n${pad}}`
}

/**
 * 为 oneOf/anyOf/allOf 联合类型构建 defineFull(...) 函数代码
 * 使用第一个变体生成默认值（discriminated union 或普通联合类型均适用）
 */
const buildUnionDefaultFn = (name: string, schema: OpenAPISchemaObject, ctx: FieldGenContext): string => {
  const variants = resolveSchemaVariants(schema)
  if (variants.length === 0) return ''

  // Ref 类型变体：直接转发
  const rawVariants = schema.oneOf ?? schema.anyOf ?? schema.allOf ?? []
  const firstRaw = rawVariants[0]
  if (isRef(firstRaw)) {
    const refName = getRefName(firstRaw.$ref)
    return `
export const ${fullFnName(name)} = defineFull<Types.${getTypeName(name)}>(
  (notNull) => ({
    ...${fullFnName(refName)}({ notNull })
  })
)

export const ${initFnName(name)} = defineInit<Types.${getTypeName(name)}>(
  () => ({
    ...${initFnName(refName)}()
  })
)
`
  }

  // 取第一个 object 变体生成
  const firstObj = variants.find((v) => v.type === 'object')
  if (firstObj) return buildObjectDefaultFn(name, firstObj, ctx) + buildObjectPartialFn(name, firstObj, ctx)

  return ''
}

const checkRequriedImports = (requiredUtils: FieldGenContext['requiredUtils']) => {
  let code = ''
  if (requiredUtils.size) {
    console.log(Array.from(requiredUtils))
    code += `import { ${Array.from(requiredUtils).join(', ')} } from '@workspace-hmeqo/util/lib/date'
`
  }
  return code
}

// ─── 插件入口 ─────────────────────────────────────────────────────────────────

export const defaultsPlugin = createPlugin((outputDir: string, opts?: DefaultsPluginOpts) => ({
  afterOpenapiParse(document) {
    const schemas: OpenAPISchemas = document.components?.schemas ?? {}
    if (Object.keys(schemas).length === 0) return

    let code = ''

    // 阶段 1：收集 enum / integer alias 等简单数据类型（直接返回固定值的函数）
    const dataTypeNames: string[] = []

    const ctx: FieldGenContext = {
      opts,
      dataTypeNames,
      requiredUtils: new Set(),
    }

    for (const [name, schema] of Object.entries(schemas)) {
      if (!isSchemaObject(schema)) continue
      if (opts?.filter && !opts.filter(name, schema)) continue

      if (schema.enum?.length) {
        code += `\nexport const ${defaultFnName(name)} = (): Types.${getTypeName(name)} => ${JSON.stringify(schema.enum[0])}\n`
        dataTypeNames.push(name)
      } else if (schema.type === 'integer') {
        code += `\nexport const ${defaultFnName(name)} = (): number => ${getNonNullExpr(name, schema, ctx)}\n`
        dataTypeNames.push(name)
      }
    }

    // 阶段 2：生成 object / union 类型的 defineFull + defineInit 函数
    for (const [name, schema] of Object.entries(schemas)) {
      if (!isSchemaObject(schema)) continue
      if (opts?.filter && !opts.filter(name, schema)) continue
      if (dataTypeNames.includes(name)) continue

      if (schema.type === 'object') {
        code += buildObjectDefaultFn(name, schema, ctx)
        code += buildObjectPartialFn(name, schema, ctx)
      } else if (schema.oneOf || schema.anyOf || schema.allOf) {
        code += buildUnionDefaultFn(name, schema, ctx)
      }
    }

    code = runtimeHelperCode(checkRequriedImports(ctx.requiredUtils)) + code

    const outPath = path.join(outputDir, 'defaults.ts')
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, code)
  },
}))
