/// <reference types="node" />

import { createPlugin } from '@alova/wormhole/plugin'
import type { OpenAPIV3 } from 'openapi-types'
import {
  defaultFnName,
  extractDiscriminatedVariants,
  fullFnName,
  getRefName,
  getTypeName,
  initFnName,
  isDiscriminatedUnion,
  isRef,
  isSchemaObject,
  resolveSchemaVariants,
  type OpenAPISchema,
  type OpenAPISchemaObject,
  type OpenAPISchemas,
} from '../util/openapi'
import { buildIfChain, writeGeneratedFile } from '../util/codegen'

// ─── 插件配置 ─────────────────────────────────────────────────────────────────

export interface DefaultsPluginOpts {
  /** 过滤不需要生成的 schema */
  filter?: (name: string, schema: OpenAPISchema) => boolean
  /** 自定义某个字段的默认值表达式 */
  customDefaultExpr?: (key: string, schema: OpenAPISchemaObject) => string | undefined
  /** 标记为文件类型的字段名（生成 new Blob([])） */
  fileFieldNames?: string[]
  /** 关联对象的联合类型区分字段
   * @default 'type'
   */
  unionType?: string
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
/* eslint-disable @typescript-eslint/unified-signatures */
import type Types from './globals'
import { defu } from 'defu'
${extraImports}
export type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: T[K] extends (infer U)[] ? DeepRequired<U>[] : T[K] extends object ? DeepRequired<T[K]> : T[K] }
  : T

export type DeepNotNull<T> = T extends object
  ? { [K in keyof T]-?: T[K] extends (infer U)[] ? DeepNotNull<U>[] : T[K] extends object ? DeepNotNull<T[K]> : NonNullable<T[K]> }
  : NonNullable<T>


type DefineFullFn<T> = {
  (): DeepRequired<T>
  (obj: Partial<DeepRequired<T>>): DeepRequired<T>
  (opts: { obj?: Partial<DeepNotNull<T>>; notNull: true }): DeepNotNull<T>
  (opts: { obj?: Partial<DeepRequired<T>>; notNull?: false }): DeepRequired<T>
}

const defineFull = <T>(
  fields: (notNull: boolean, obj?: any) => DeepRequired<T>,
): DefineFullFn<T> => {
  return (arg?: any): any => {
    const { notNull, obj } = arg?.notNull === undefined ? { notNull: false, obj: arg } : arg as { notNull: boolean; obj?: any }
    if (!obj) return fields(notNull)
    return defu(obj, fields(notNull, obj) as any)
  }
}

const defineInit = <T>(
  fields: (obj?: Partial<T>) => T,
) => {
  return <O extends Partial<T> & Record<string, any>>(obj?: O): T => {
    if (!obj) return fields()
    return defu(obj, fields(obj) as any) as T
  }
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
          ctx.requiredImports.add('uuidv4')
          return 'uuidv4()'
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
  if (isNullable(schema)) {
    return `notNull ? ${getNonNullExpr(fieldName, schema, ctx)} : null`
  }
  return getNonNullExpr(fieldName, schema, ctx)
}

// ─── 层 2：字段值表达式生成（Schema → 代码表达式）────────────────────────────

interface FieldGenContext {
  opts?: DefaultsPluginOpts
  /** 已注册为简单数据类型的 schema 名（enum / integer alias），不需要 notNull 参数 */
  dataTypeNames: string[]
  requiredUtils: Set<'dateString' | 'timeString'>
  requiredImports: Set<'uuidv4'>
  /** 当前字段访问路径，用于 discriminated union 的 ref 调用时传入 obj 参数 */
  fieldPath?: string[]
  /** 全量 schema 定义，用于 $ref 解析（flattenAllOf 时展开引用类型） */
  schemas?: OpenAPISchemas
}

type FieldMode = 'full' | 'partial'

/**
 * 生成单个字段的默认值表达式
 * - $ref → 调用对应的 fullXxx/initXxx 函数
 * - allOf/anyOf/oneOf → 取第一个非 null 变体递归
 * - 内联 object（有 properties）→ 展开字面量
 * - 其他 → 原始值（nullable 字段生成条件表达式）
 */
const buildFieldExpr = (
  fieldName: string,
  schema: OpenAPISchema,
  ctx: FieldGenContext,
  indent = 4,
  mode: FieldMode = 'full',
): string => {
  if (isRef(schema)) {
    const refName = getRefName(schema.$ref)
    const isDataType = ctx.dataTypeNames.includes(refName)

    // 简单类型（enum/integer alias）使用 defaultFn
    if (isDataType) return `${defaultFnName(refName)}()`

    // partial 模式
    if (mode === 'partial') {
      if (ctx.fieldPath) {
        const objAccess = `(obj as any)?.${ctx.fieldPath.join('.')}`
        return `${initFnName(refName)}(${objAccess})`
      }
      return `${initFnName(refName)}()`
    }

    // full 模式
    if (ctx.fieldPath) {
      const objAccess = `(obj as any)?.${ctx.fieldPath.join('.')}`
      return `${fullFnName(refName)}({ notNull: notNull as any, obj: ${objAccess} })`
    }
    return `${fullFnName(refName)}({ notNull: notNull as any })`
  }

  if (!isSchemaObject(schema)) return 'undefined'

  // allOf/anyOf/oneOf：取第一个非 null 类型变体递归处理
  const nonNullOf = (schema.allOf ?? schema.anyOf ?? schema.oneOf)?.find(
    (v) => !(isSchemaObject(v) && v.type === 'null'),
  )
  if (nonNullOf) return buildFieldExpr(fieldName, nonNullOf, ctx, indent, mode)

  if (schema.enum?.length) return JSON.stringify(schema.enum[0])

  // nullable → null (partial 模式)
  if (mode === 'partial' && isNullable(schema)) return 'null'

  // 内联 object（有具名属性）：展开字面量
  if (schema.type === 'object' && schema.properties && Object.keys(schema.properties).length > 0) {
    return buildInlineObjectExpr(schema, ctx, indent, mode)
  }

  if (schema.type === 'array') return '[]'

  // partial 模式用不同的表达式
  if (mode === 'partial') return getNonNullExpr(fieldName, schema, ctx)
  return getPrimitiveDefaultExpr(fieldName, schema, ctx)
}

/**
 * 生成内联 object 的字面量表达式
 */
const buildInlineObjectExpr = (
  schema: OpenAPISchemaObject,
  ctx: FieldGenContext,
  indentSize: number,
  mode: FieldMode = 'full',
): string => {
  const properties = schema.properties ?? {}
  if (Object.keys(properties).length === 0) return '{}'

  const pad = ' '.repeat(indentSize - 2)
  const innerPad = ' '.repeat(indentSize)

  // partial 模式只处理 required 字段
  const required = mode === 'partial' ? new Set<string>(schema.required ?? []) : null

  const lines: string[] = []
  for (const [key, prop] of Object.entries(properties)) {
    if (required && !required.has(key)) continue
    const ctxWithPath = ctx.fieldPath ? { ...ctx, fieldPath: [...ctx.fieldPath, key] } : { ...ctx, fieldPath: [key] }
    lines.push(`${innerPad}${key}: ${buildFieldExpr(key, prop, ctxWithPath, indentSize, mode)}`)
  }

  if (lines.length === 0) return '{}'
  return `{\n${lines.join(',\n')}\n${pad}}`
}

// ─── 层 3：Generate 函数代码构建 ──────────────────────────────────────────────

/**
 * 为一个 object schema 构建 defineFull/init 函数代码
 *
 * - full 模式：生成所有字段（包括 optional），nullable 字段根据 notNull 参数决定是否为 null
 * - partial 模式：只生成 required 字段，optional 字段跳过，nullable 字段为 null
 *   主要用于 pickXxx 补全缺失字段，以及作为表单初始值
 */
const buildObjectFn = (name: string, schema: OpenAPISchemaObject, ctx: FieldGenContext, mode: FieldMode): string => {
  const required = mode === 'partial' ? new Set<string>(schema.required ?? []) : null

  const fieldLines = Object.entries(schema.properties ?? {})
    .filter(([fieldName]) => !required || required.has(fieldName))
    .map(([fieldName, prop]) => {
      const ctxWithPath = { ...ctx, fieldPath: [fieldName] }
      return `    ${fieldName}: ${buildFieldExpr(fieldName, prop, ctxWithPath, 4, mode)}`
    })

  const typeName = `Types.${getTypeName(name)}`
  const body = fieldLines.join(',\n')

  if (mode === 'full') {
    return `
export const ${fullFnName(name)}: DefineFullFn<${typeName}> = defineFull<${typeName}>(
  (notNull, obj) => ({
${body}
  })
)
`
  }

  return `
export const ${initFnName(name)} = defineInit<${typeName}>(
  (obj) => ({
${body}
  })
)
`
}

/**
 * 为 oneOf/anyOf/allOf 联合类型构建 defineFull(...) 函数代码
 * 使用第一个变体生成默认值（discriminated union 或普通联合类型均适用）
 */
const buildUnionDefaultFn = (name: string, schema: OpenAPISchemaObject, ctx: FieldGenContext): string => {
  const variants = resolveSchemaVariants(schema, ctx.schemas)
  if (variants.length === 0) return ''

  // Ref 类型变体：直接转发
  const rawVariants = schema.oneOf ?? schema.anyOf ?? schema.allOf ?? []
  const firstRaw = rawVariants[0]
  if (isRef(firstRaw)) {
    const refName = getRefName(firstRaw.$ref)
    return `
export const ${fullFnName(name)}: DefineFullFn<Types.${getTypeName(name)}> = defineFull<Types.${getTypeName(name)}>(
  (notNull, obj) => ({
    ...${fullFnName(refName)}({ notNull, ...obj })
  })
)

export const ${initFnName(name)} = defineInit<Types.${getTypeName(name)}>(
  (obj) => ({
    ...${initFnName(refName)}(obj)
  })
)
`
  }

  // discriminated union：生成 if 链分发
  const detectedUnionType = isDiscriminatedUnion(variants, ctx.opts?.unionType)
  if (detectedUnionType !== false) {
    const unionType = detectedUnionType
    const discriminatedVariants = extractDiscriminatedVariants(variants, rawVariants, unionType)
    if (!discriminatedVariants[0]) return ''

    // 从变体 schema 中移除 unionType 字段（避免重复输出）
    const withoutUnionType = (variant: OpenAPISchemaObject): OpenAPISchemaObject => ({
      ...variant,
      required: variant.required?.filter((k) => k !== unionType) ?? [],
      properties: Object.fromEntries(Object.entries(variant.properties ?? {}).filter(([k]) => k !== unionType)),
    })

    // 生成单个变体的内层展开表达式
    const buildVariantInnerExpr = (
      { schema: variant, refName }: (typeof discriminatedVariants)[number],
      mode: FieldMode,
    ): string => {
      if (refName) {
        return mode === 'partial'
          ? `${initFnName(refName)}(obj)`
          : `${fullFnName(refName)}({ notNull: notNull as any })`
      }
      return buildInlineObjectExpr(withoutUnionType(variant), { ...ctx, fieldPath: [] }, 6, mode)
    }

    const buildVariantReturn = (dv: (typeof discriminatedVariants)[number], mode: FieldMode) =>
      `{ ${unionType}: ${JSON.stringify(dv.typeValue)}, ...${buildVariantInnerExpr(dv, mode)} }`

    const buildCond = (dv: (typeof discriminatedVariants)[number]) =>
      `obj?.${unionType} === ${JSON.stringify(dv.typeValue)}`

    return `
export const ${fullFnName(name)}: DefineFullFn<Types.${getTypeName(name)}> = defineFull<Types.${getTypeName(name)}>(
  (notNull, obj) => {
${buildIfChain(discriminatedVariants, buildCond, (dv) => buildVariantReturn(dv, 'full'))}
  }
)

export const ${initFnName(name)} = defineInit<Types.${getTypeName(name)}>(
  (obj) => {
${buildIfChain(discriminatedVariants, buildCond, (dv) => buildVariantReturn(dv, 'partial'))}
  }
)
`
  }

  // 取第一个 object 变体生成
  const firstObj = variants.find((v) => v.type === 'object')
  if (firstObj) return buildObjectFn(name, firstObj, ctx, 'full') + buildObjectFn(name, firstObj, ctx, 'partial')

  return ''
}

const checkRequriedImports = (ctx: FieldGenContext) => {
  let code = ''
  const { requiredUtils, requiredImports } = ctx
  if (requiredUtils.size) {
    code += `import { ${Array.from(requiredUtils).join(', ')} } from '@workspace-hmeqo/util/lib/date'
`
  }
  if (requiredImports.has('uuidv4')) {
    code += `import { uuidv4 } from 'uuid'
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
      requiredImports: new Set(),
      schemas,
    }

    for (const [name, schema] of Object.entries(schemas)) {
      if (!isSchemaObject(schema)) continue
      if (opts?.filter && !opts.filter(name, schema)) continue

      if (schema.enum?.length) {
        code += `\nexport const ${defaultFnName(name)} = (): Types.${getTypeName(name)} => ${JSON.stringify(schema.enum[0])}\n`
        dataTypeNames.push(name)
      } else if (schema.type === 'number' || schema.type === 'integer') {
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
        code += buildObjectFn(name, schema, ctx, 'full')
        code += buildObjectFn(name, schema, ctx, 'partial')
      } else if (schema.oneOf || schema.anyOf || schema.allOf) {
        code += buildUnionDefaultFn(name, schema, ctx)
      }
    }

    code = runtimeHelperCode(checkRequriedImports(ctx)) + code

    writeGeneratedFile(outputDir, 'defaults.ts', code)
  },
}))
