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
 */
export interface DiscriminatedVariant {
  typeValue: string
  schema: OpenAPISchemaObject
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
 * 从已验证的 discriminated union 变体中提取 type 值和 schema
 */
export const extractDiscriminatedVariants = (variants: OpenAPISchemaObject[]): DiscriminatedVariant[] => {
  return variants.map((variant) => {
    const typeField = variant.properties!['type'] as OpenAPISchemaObject
    return {
      typeValue: String(typeField.enum![0]),
      schema: variant,
    }
  })
}

/**
 * 从 openOf/anyOf/allOf schema 中取出所有非 Ref 的变体
 */
export const resolveSchemaVariants = (schema: OpenAPISchemaObject): OpenAPISchemaObject[] => {
  const variants = schema.oneOf ?? schema.anyOf ?? schema.allOf ?? []
  return variants.filter((v): v is OpenAPISchemaObject => isSchemaObject(v))
}
