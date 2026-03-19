import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type OpenAPISchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject
export type OpenAPIReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject

export type OpenAPISchema = OpenAPISchemaObject | OpenAPIReferenceObject
export type OpenAPISchemas = Record<string, OpenAPISchema>

// ─── 基础判断工具 ────────────────────────────────────────────────────────────

export const isRef = (s: OpenAPISchema): s is OpenAPIReferenceObject => '$ref' in s
export const isSchemaObject = (s: OpenAPISchema): s is OpenAPISchemaObject => !isRef(s)
export const isEnum = (s: OpenAPISchema): boolean => isSchemaObject(s) && 'enum' in s
export const getRefName = (ref: string) => ref.split('/').pop()!

// ─── 命名工具 ────────────────────────────────────────────────────────────────

export const getTypeName = (name: string) => {
  const parts = name.split('.')
  return parts
    .map((part, index) => {
      if (index === 0) {
        return part.charAt(0).toUpperCase() + part.slice(1)
      }
      return part
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replaceAll('-', '_')
    })
    .join('_')
}

export const fullFnName = (schemaName: string) => `full${getTypeName(schemaName)}`
export const initFnName = (schemaName: string) => `init${getTypeName(schemaName)}`
export const defaultFnName = (schemaName: string) => `default${getTypeName(schemaName)}`

/** Convert object to compact string, e.g. { min: 1, max: 10 } */
export const toObjStr = (obj: Record<string, unknown>) => {
  const props = Object.entries(obj)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  return `{ ${props.join(', ')} }`
}

// ─── Schema 结构分类 ──────────────────────────────────────────────────────────

/**
 * 一个 oneOf/anyOf/allOf 的 discriminated union 变体（含 type enum 判别字段）
 * - refName: 若该变体由 allOf [$ref, {type discriminator}] 组成，记录 $ref 名称，
 *   代码生成时应调用 fullXxx/initXxx 而非内联展开字段
 */
export interface DiscriminatedVariant {
  typeValue: string
  schema: OpenAPISchemaObject
  /** allOf 中包含的 $ref schema 名，存在时应生成 ref 函数调用 */
  refName?: string
}

/**
 * 判断 schema 是否为 discriminated union：
 * 所有变体均为 object 类型，且都有 type 字段（enum 只有 1 个值）
 */
export const isDiscriminatedUnion = (variants: OpenAPISchemaObject[]): boolean => {
  return variants.every((v) => {
    if (v.type !== 'object') return false
    const typeField = v.properties?.['type']
    return typeField && isSchemaObject(typeField) && typeField.enum?.length === 1
  })
}

/**
 * 从已验证的 discriminated union 变体中提取 type 值、schema 和可选的 refName。
 * @param variants 展开后的变体列表（resolveSchemaVariants 的结果）
 * @param rawVariants 原始（展开前）的 oneOf/anyOf 变体列表，用于提取 allOf $ref 信息
 */
export const extractDiscriminatedVariants = (
  variants: OpenAPISchemaObject[],
  rawVariants?: OpenAPISchema[],
): DiscriminatedVariant[] => {
  return variants.map((variant, i) => {
    const typeField = variant.properties!['type'] as OpenAPISchemaObject
    const raw = rawVariants?.[i]
    // 检查原始变体是否为 allOf [$ref, ...] 结构，提取 $ref 名称
    const refName =
      raw && isSchemaObject(raw) && raw.allOf
        ? raw.allOf.reduce<string | undefined>((found, part) => found ?? (isRef(part) ? getRefName(part.$ref) : undefined), undefined)
        : undefined
    return {
      typeValue: String(typeField.enum![0]),
      schema: variant,
      refName,
    }
  })
}

/**
 * 展开 allOf，将所有属性合并到顶层
 */
const flattenAllOf = (schema: OpenAPISchemaObject, schemas?: OpenAPISchemas): OpenAPISchemaObject => {
  if (!schema.allOf) return schema

  const result: OpenAPISchemaObject = { ...schema }
  delete result.allOf

  const properties: Record<string, OpenAPISchema> = {}
  const required: string[] = []

  for (const part of schema.allOf) {
    if (isRef(part) && schemas) {
      const refName = getRefName(part.$ref)
      const refSchema = schemas[refName]
      if (refSchema && isSchemaObject(refSchema) && refSchema.type === 'object' && refSchema.properties) {
        Object.assign(properties, refSchema.properties)
        if (refSchema.required) required.push(...refSchema.required)
      }
      continue
    }

    if (!isSchemaObject(part)) continue

    if (part.type === 'object' && part.properties) {
      Object.assign(properties, part.properties)
      if (part.required) required.push(...part.required)
    }
    if (part.allOf) {
      const nested = flattenAllOf(part, schemas)
      if (nested.properties) Object.assign(properties, nested.properties)
      if (nested.required) required.push(...nested.required)
    }
  }

  result.type = 'object'
  result.properties = properties
  if (required.length > 0) result.required = required
  return result
}

/**
 * 从 oneOf/anyOf/allOf schema 中取出所有非 Ref 的变体，并展开 allOf
 */
export const resolveSchemaVariants = (schema: OpenAPISchemaObject, schemas?: OpenAPISchemas): OpenAPISchemaObject[] => {
  const variants = schema.oneOf ?? schema.anyOf ?? schema.allOf ?? []
  return variants
    .filter((v): v is OpenAPISchemaObject => isSchemaObject(v))
    .map((v) => (v.allOf ? flattenAllOf(v, schemas) : v))
}
