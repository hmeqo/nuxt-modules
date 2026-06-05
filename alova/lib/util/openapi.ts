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
        return part.charAt(0).toUpperCase() + part.slice(1).replaceAll('-', '_')
      }
      return (
        part
          // Handle acronym boundaries: "VOBase" -> "VO_Base"
          .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
          // Handle camelCase boundaries: "couponVO" -> "coupon_VO"
          .replace(/([a-z\d])([A-Z])/g, '$1_$2')
          .toLowerCase()
          .replaceAll('-', '_')
      )
    })
    .join('_')
}

export const fullFnName = (schemaName: string) => `$full${getTypeName(schemaName)}`
export const initFnName = (schemaName: string) => `$init${getTypeName(schemaName)}`
export const defaultFnName = (schemaName: string) => `$default${getTypeName(schemaName)}`

/** Convert object to compact string, e.g. { min: 1, max: 10 } */
export const toObjStr = (obj: Record<string, unknown>) => {
  const props = Object.entries(obj)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  return `{ ${props.join(', ')} }`
}

// ─── Discriminated Union ──────────────────────────────────────────────────────

/**
 * 一个 oneOf/anyOf/allOf 的 discriminated union 变体
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
 * 检查所有变体是否都有指定字段且该字段为固定 enum 值。
 */
const hasEnumFieldInAllVariants = (variants: OpenAPISchemaObject[], fieldName: string): boolean =>
  variants.every((v) => {
    const f = v.properties?.[fieldName]
    return f && isSchemaObject(f) && f.enum?.length === 1
  })

/**
 * 检测 discriminated union 的区分字段名。
 *
 * 优先级：
 *  1. OpenAPI 3.1 discriminator.propertyName（如果有效）
 *  2. 用户配置的 preferredField（如 unionType 选项）
 *  3. 从第一个变体中推断（找所有变体都有的固定 enum 值字段）
 *
 * @param variants 展开后的变体列表
 * @param preferredField 优先使用的字段名
 * @param parentSchema 父级 schema，可携带 OpenAPI 3.1 discriminator 声明
 * @returns 区分字段名，若不是 discriminated union 则返回 false
 */
export const detectDiscriminatorField = (
  variants: OpenAPISchemaObject[],
  preferredField?: string,
  parentSchema?: OpenAPISchemaObject,
): string | false => {
  if (variants.length === 0) return false

  // 1. OpenAPI 3.1 显式声明优先
  const discField = parentSchema?.discriminator?.propertyName
  if (discField && hasEnumFieldInAllVariants(variants, discField)) {
    return discField
  }

  if (!variants.every((v) => v.type === 'object')) return false

  const firstProps = variants[0].properties ?? {}
  const candidates = Object.entries(firstProps)
    .filter(([, prop]) => isSchemaObject(prop) && prop.enum?.length === 1)
    .map(([key]) => key)

  if (candidates.length === 0) return false

  // 2. 用户配置的优先字段
  if (preferredField && candidates.includes(preferredField)) {
    if (hasEnumFieldInAllVariants(variants, preferredField)) return preferredField
  }

  // 3. 推断：按候选顺序找第一个所有变体都有的固定 enum 字段
  for (const field of candidates) {
    if (hasEnumFieldInAllVariants(variants, field)) return field
  }

  return false
}

/**
 * 从已验证的 discriminated union 变体中提取 type 值、schema 和可选的 refName。
 */
export const extractDiscriminatedVariants = (
  variants: OpenAPISchemaObject[],
  rawVariants?: OpenAPISchema[],
  unionField = 'type',
): DiscriminatedVariant[] => {
  return variants.map((variant, i) => {
    const typeField = variant.properties![unionField] as OpenAPISchemaObject
    const raw = rawVariants?.[i]
    // 检查原始变体是否为 allOf [$ref, ...] 结构，提取 $ref 名称
    const refName =
      raw && isSchemaObject(raw) && raw.allOf
        ? raw.allOf.reduce<string | undefined>(
            (found, part) => found ?? (isRef(part) ? getRefName(part.$ref) : undefined),
            undefined,
          )
        : undefined
    return {
      typeValue: String(typeField.enum![0]),
      schema: variant,
      refName,
    }
  })
}

/**
 * 一次调用完成 discriminated union 的检测与提取。
 * 成功返回结果对象，失败返回 null。
 */
export interface DiscriminatedUnionResult {
  fieldName: string
  variants: DiscriminatedVariant[]
}

export const tryResolveDiscriminatedUnion = (
  schema: OpenAPISchemaObject,
  schemas?: OpenAPISchemas,
  preferredField?: string,
): DiscriminatedUnionResult | null => {
  const variants = resolveSchemaVariants(schema, schemas)
  if (variants.length === 0) return null

  const fieldName = detectDiscriminatorField(variants, preferredField, schema)
  if (fieldName === false) return null

  const rawVariants = schema.oneOf ?? schema.anyOf ?? schema.allOf ?? []
  const discriminatedVariants = extractDiscriminatedVariants(variants, rawVariants, fieldName)
  if (!discriminatedVariants[0]) return null

  return { fieldName, variants: discriminatedVariants }
}

/**
 * 从 object schema 中移除指定字段（用于生成变体代码时排除区分字段）。
 */
export const stripField = (schema: OpenAPISchemaObject, fieldName: string): OpenAPISchemaObject => ({
  ...schema,
  required: schema.required?.filter((k) => k !== fieldName) ?? [],
  properties: Object.fromEntries(Object.entries(schema.properties ?? {}).filter(([k]) => k !== fieldName)),
})

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
