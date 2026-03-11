/// <reference types="node" />

import { createPlugin } from '@alova/wormhole/plugin'
import fs from 'node:fs'
import path from 'node:path'
import {
  extractDiscriminatedVariants,
  getRefName,
  getTypeName,
  initFnName,
  isDiscriminatedUnion,
  isEnum,
  isRef,
  isSchemaObject,
  resolveSchemaVariants,
  type OpenAPISchema,
  type OpenAPISchemaObject,
  type OpenAPISchemas,
} from '../util/openapi'

// ─── 插件配置 ─────────────────────────────────────────────────────────────────

export type PkRule = {
  /** 关联对象的主键字段名，如 "id" */
  pk: string
  /** 目标字段的后缀，如 "_id" */
  suffix: string
  /** 是否为数组（生成 map 表达式） */
  isArray?: boolean
  /** 排除某些字段不做 PK 映射 */
  excludes?: string[]
}

export type PickOpts = {
  /** 过滤不需要生成的 schema */
  filter?: (name: string) => boolean
  /** PK 映射规则 */
  pk?: PkRule[]
}

// ─── 运行时帮助代码（注入到生成文件头部）────────────────────────────────────

//
// 定义一个 pick 函数，用于从 resp 对象提取字段，输出完整的 req/model 对象。
//
// 用途：将后端响应（resp）类型安全地转换为请求（req）或模型类型。
// - pickFn：从 obj 中提取所有字段（支持嵌套递归 pick）
// - pkFn：PK 映射（如从关联对象中提取 id：{ device_id: obj?.device?.id }）
// - fn：initXxx，用于补全 obj 中缺失的字段（只补全有 schema 默认值的字段）
//
// 返回类型始终为 T（完整类型），因为 pick 一般从完整 resp 对象中提取。
//
const RUNTIME_HELPER_CODE = `/* eslint-disable @typescript-eslint/no-explicit-any */
import * as defaults from './defaults'
import type Types from './globals'

const definePick = <T extends object>(
  pickFn: (obj: any) => Partial<T>,
  pkFn: (obj: any) => Partial<T>,
  fn: () => T,
) => {
  function pick(obj: any): T
  function pick<O extends object>(obj: any, fnOverride: () => O): O
  function pick<O extends object>(obj: any, fnOverride?: () => O): T | O {
    const picked: Partial<T> = obj != null ? pickFn(obj) : {}

    if (obj != null) {
      for (const [k, v] of Object.entries(pkFn(obj))) {
        if (v !== undefined) picked[k as keyof T] = v as T[keyof T]
      }
    }

    for (const [k, v] of Object.entries((fnOverride ?? fn)())) {
      const pickedV = picked[k as keyof T]
      if (pickedV === undefined || pickedV === null) picked[k as keyof T] = v as T[keyof T]
    }

    return picked as T | O
  }
  return pick
}
`

// ─── 层 1：PK 表达式生成 ──────────────────────────────────────────────────────

const pickFnName = (schemaName: string) => `pick${getTypeName(schemaName)}`

/**
 * 根据 PK 规则为 schema 的字段生成 pk 映射表达式
 * 例：{ slave_id: obj?.slave?.id }
 */
const buildPkExpr = (schema: OpenAPISchemaObject, pkRules: PkRule[]): string => {
  const lines: string[] = []

  for (const key of Object.keys(schema.properties ?? {})) {
    const rule = pkRules.find((r) => key.endsWith(r.suffix) && !r.excludes?.includes(key))
    if (!rule) continue

    const sourceProp = key.slice(0, -rule.suffix.length)
    const expr = rule.isArray
      ? `${key}: obj?.${sourceProp}?.map((i: any) => i?.${rule.pk})`
      : `${key}: obj?.${sourceProp}?.${rule.pk}`
    lines.push(expr)
  }

  return lines.length ? `{ ${lines.join(', ')} }` : '{}'
}

// ─── 层 2：字段取值表达式生成 ─────────────────────────────────────────────────

/**
 * 为单个字段生成取值表达式
 * @param accessPrefix 访问路径前缀（默认 "obj?."，嵌套时可传 "obj?.payload?."）
 *
 * 规则：
 * - $ref → 若目标是 object/union 则递归 pickFn，否则直接取值
 * - array with object $ref items → map + pickFn
 * - 其他 → 直接取值
 */
const buildFieldExpr = (
  fieldName: string,
  schema: OpenAPISchema,
  schemas: OpenAPISchemas,
  accessPrefix = 'obj?.',
): string => {
  const access = `${accessPrefix}${fieldName}`

  if (isRef(schema)) {
    const refName = getRefName(schema.$ref)
    const target = schemas[refName]
    if (target && isSchemaObject(target) && !isEnum(target)) {
      const hasNestedFields = target.type === 'object' || target.oneOf || target.anyOf || target.allOf
      if (hasNestedFields) return `${pickFnName(refName)}(${access})`
    }
    return access
  }

  if (!isSchemaObject(schema) || isEnum(schema)) return access

  // array：若 item 是可深层 pick 的 $ref，生成 map 表达式
  if (schema.type === 'array' && schema.items && isRef(schema.items)) {
    const refName = getRefName(schema.items.$ref)
    const target = schemas[refName]
    if (target && isSchemaObject(target) && !isEnum(target)) {
      const hasNestedFields = target.type === 'object' || target.oneOf || target.anyOf || target.allOf
      if (hasNestedFields) return `${access}?.map((i: any) => ${pickFnName(refName)}(i))`
    }
  }

  return access
}

/**
 * 为内联 object（有 properties 定义）生成展开的字段字面量表达式
 * @param parentAccess 父字段的访问路径，如 "obj?.payload"
 */
const buildInlineObjectExpr = (
  parentAccess: string,
  schema: OpenAPISchemaObject,
  schemas: OpenAPISchemas,
  indent: number,
): string => {
  const properties = schema.properties ?? {}
  if (Object.keys(properties).length === 0) return parentAccess

  const pad = ' '.repeat(indent)
  const innerPad = ' '.repeat(indent + 2)
  const lines: string[] = []

  for (const [key, prop] of Object.entries(properties)) {
    lines.push(`${innerPad}${key}: ${buildFieldExpr(key, prop, schemas, `${parentAccess}?.`)}`)
  }

  return `{\n${lines.join(',\n')}\n${pad}}`
}

// ─── 层 3：Pick 函数代码构建 ──────────────────────────────────────────────────

/**
 * 为普通 object schema 构建 definePick(...) 函数代码
 */
const buildObjectPickFn = (
  name: string,
  schema: OpenAPISchemaObject,
  schemas: OpenAPISchemas,
  pkRules: PkRule[],
): string => {
  const fieldLines = Object.entries(schema.properties ?? {}).map(
    ([key, prop]) => `    ${key}: ${buildFieldExpr(key, prop, schemas)}`,
  )

  return `
export const ${pickFnName(name)} = definePick<Types.${getTypeName(name)}>(
  (obj) => ({
${fieldLines.join(',\n')}
  }),
  (obj) => (${buildPkExpr(schema, pkRules)}),
  defaults.${initFnName(name)}
)
`
}

/**
 * 为 discriminated union 构建带 switch dispatch 的 definePick(...) 函数代码
 * 每个 case 对应一个变体，内联 object 字段按字段展开取值
 */
const buildDiscriminatedUnionPickFn = (
  name: string,
  variants: OpenAPISchemaObject[],
  schemas: OpenAPISchemas,
): string => {
  const cases = extractDiscriminatedVariants(variants).map(({ typeValue, schema: variant }) => {
    const otherFields = Object.entries(variant.properties ?? {})
      .filter(([key]) => key !== 'type')
      .map(([key, prop]) => {
        // 内联 object：展开取值；其他：直接取值
        const isInlineObject =
          isSchemaObject(prop) && prop.type === 'object' && prop.properties && Object.keys(prop.properties).length > 0

        const expr = isInlineObject
          ? buildInlineObjectExpr(`obj?.${key}`, prop, schemas, 8)
          : buildFieldExpr(key, prop, schemas)

        return `        ${key}: ${expr}`
      })

    if (otherFields.length === 0) {
      return `      case ${JSON.stringify(typeValue)}: return { type: obj?.type }`
    }
    return `      case ${JSON.stringify(typeValue)}: return {\n        type: obj?.type,\n${otherFields.join(',\n')}\n      }`
  })

  return `
export const ${pickFnName(name)} = definePick<Types.${getTypeName(name)}>(
  (obj) => {
    switch (obj?.type) {
${cases.join('\n')}
      default: return { type: obj?.type }
    }
  },
  (obj) => ({}),
  defaults.${initFnName(name)}
)
`
}

// ─── 插件入口 ─────────────────────────────────────────────────────────────────

export const pickPlugin = createPlugin((outputDir: string, opts?: PickOpts) => ({
  afterOpenapiParse(document) {
    const schemas: OpenAPISchemas = document.components?.schemas ?? {}
    if (Object.keys(schemas).length === 0) return

    const pkRules = opts?.pk ?? []
    let code = RUNTIME_HELPER_CODE

    for (const [name, schema] of Object.entries(schemas)) {
      if (opts?.filter && !opts.filter(name)) continue
      if (!isSchemaObject(schema)) continue

      // 普通 object 类型
      if (schema.type === 'object' && schema.properties) {
        code += buildObjectPickFn(name, schema, schemas, pkRules)
        continue
      }

      // oneOf/anyOf/allOf 联合类型
      const schemaVariants = resolveSchemaVariants(schema)
      if (schemaVariants.length === 0) continue

      if (isDiscriminatedUnion(schemaVariants)) {
        // Discriminated union：switch dispatch
        code += buildDiscriminatedUnionPickFn(name, schemaVariants, schemas)
      } else {
        // 普通联合类型：取第一个 object 变体生成
        const firstObj = schemaVariants.find((v) => v.type === 'object' && v.properties)
        if (firstObj) code += buildObjectPickFn(name, firstObj, schemas, pkRules)
      }
    }

    const outPath = path.join(outputDir, 'pick.ts')
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, code)
  },
}))
