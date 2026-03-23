/// <reference types="node" />

import { createPlugin } from '@alova/wormhole/plugin'
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
import { buildIfChain, writeGeneratedFile } from '../util/codegen'

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
  /** 关联对象的联合类型区分字段
   * @default 'type'
   */
  unionType?: string
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
import { deepFill } from '@workspace-hmeqo/util/lib'

type DefinePickFn<T> = {
  (obj: any): T
  <O extends object>(obj: any, fnOverride: (obj?: any) => O): O
}

const definePick = <T extends object>(
  pickFn: (obj: any) => Partial<T>,
  pkFn: (obj: any) => Partial<T>,
  fn: (obj?: any) => T,
): DefinePickFn<T> => {
  return <O extends object>(obj: any, fnOverride?: (obj?: any) => O): T | O => {
    const picked: Partial<T> = obj != null ? pickFn(obj) : {}

    if (obj != null) {
      for (const [k, v] of Object.entries(pkFn(obj))) {
        if (v !== undefined) picked[k as keyof T] = v as T[keyof T]
      }
    }

    const source = (fnOverride ?? fn)(picked);
    deepFill(picked, source);

    return picked as T | O;
  }
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
 * 判断一个 schema 是否为有具名属性的内联 object（需要展开取值）
 */
const isInlineObject = (prop: OpenAPISchema): prop is OpenAPISchemaObject =>
  isSchemaObject(prop) && prop.type === 'object' && !!prop.properties && Object.keys(prop.properties).length > 0

/**
 * 判断一个 $ref 指向的 schema 是否需要递归 pick（object/union 类型且非 enum）
 */
const isPickableRef = (refName: string, schemas: OpenAPISchemas): boolean => {
  const target = schemas[refName]
  if (!target || !isSchemaObject(target) || isEnum(target)) return false
  // 纯字典类型（如 Record<string, any>，只有 additionalProperties 无 properties）无需递归 pick
  if (target.type === 'object' && !target.properties) return false
  return !!(target.type === 'object' || target.oneOf || target.anyOf || target.allOf)
}

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
    if (isPickableRef(refName, schemas)) return `${pickFnName(refName)}(${access})`
    return access
  }

  if (!isSchemaObject(schema) || isEnum(schema)) return access

  // array：若 item 是可深层 pick 的 $ref，生成 map 表达式
  if (schema.type === 'array' && schema.items && isRef(schema.items)) {
    const refName = getRefName(schema.items.$ref)
    if (isPickableRef(refName, schemas)) {
      return `${access}?.map((i: any) => ${pickFnName(refName)}(i))`
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
  indentSize: number,
): string => {
  const properties = schema.properties ?? {}
  if (Object.keys(properties).length === 0) return parentAccess

  const pad = ' '.repeat(indentSize)
  const innerPad = ' '.repeat(indentSize + 2)

  const lines = Object.entries(properties).map(
    ([key, prop]) => `${innerPad}${key}: ${buildFieldExpr(key, prop, schemas, `${parentAccess}?.`)}`,
  )

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

  const typeName = `Types.${getTypeName(name)}`

  return `
export const ${pickFnName(name)}: DefinePickFn<${typeName}> = definePick<${typeName}>(
  (obj) => ({
${fieldLines.join(',\n')}
  }),
  (obj) => (${buildPkExpr(schema, pkRules)}),
  defaults.${initFnName(name)}
)
`
}

/**
 * 为 discriminated union 构建带 if 链分发的 definePick(...) 函数代码
 * 每个变体对应一个 if 分支，内联 object 字段按字段展开取值，第一个变体作为 fallback
 */
const buildDiscriminatedUnionPickFn = (
  name: string,
  variants: OpenAPISchemaObject[],
  rawVariants: OpenAPISchema[],
  schemas: OpenAPISchemas,
  unionType = 'type',
): string => {
  const discriminatedVariants = extractDiscriminatedVariants(variants, rawVariants, unionType)

  const buildCaseReturn = ({ typeValue, schema: variant, refName }: (typeof discriminatedVariants)[number]): string => {
    // 若变体来自 allOf [$ref, ...] 则直接调用对应 pickXxx 函数
    if (refName) {
      return `{ ${unionType}: ${JSON.stringify(typeValue)}, ...${pickFnName(refName)}(obj) }`
    }

    const otherFields = Object.entries(variant.properties ?? {})
      .filter(([key]) => key !== unionType)
      .map(([key, prop]) => {
        const expr = isInlineObject(prop)
          ? buildInlineObjectExpr(`obj?.${key}`, prop, schemas, 8)
          : buildFieldExpr(key, prop, schemas)
        return `      ${key}: ${expr}`
      })

    if (otherFields.length === 0) {
      return `{ ${unionType}: ${JSON.stringify(typeValue)} }`
    }
    return `{
      ${unionType}: ${JSON.stringify(typeValue)},
${otherFields.join(',\n')}
    }`
  }

  const branches = buildIfChain(
    discriminatedVariants,
    (dv) => `obj?.${unionType} === ${JSON.stringify(dv.typeValue)}`,
    buildCaseReturn,
  )

  const typeName = `Types.${getTypeName(name)}`

  return `
export const ${pickFnName(name)}: DefinePickFn<${typeName}> = definePick<${typeName}>(
  (obj) => {
${branches}
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
      const rawVariants = schema.oneOf ?? schema.anyOf ?? schema.allOf ?? []
      const schemaVariants = resolveSchemaVariants(schema, schemas)
      if (schemaVariants.length === 0) continue

      const detectedUnionType = isDiscriminatedUnion(schemaVariants, opts?.unionType)
      if (detectedUnionType !== false) {
        // Discriminated union：switch dispatch
        code += buildDiscriminatedUnionPickFn(name, schemaVariants, rawVariants, schemas, detectedUnionType)
      } else {
        // 普通联合类型：取第一个 object 变体生成
        const firstObj = schemaVariants.find((v) => v.type === 'object' && v.properties)
        if (firstObj) code += buildObjectPickFn(name, firstObj, schemas, pkRules)
      }
    }

    writeGeneratedFile(outputDir, 'pick.ts', code)
  },
}))
