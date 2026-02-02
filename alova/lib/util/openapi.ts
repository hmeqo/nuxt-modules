import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type OpenAPISchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject
export type OpenAPIReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject

export type OpenAPISchema = OpenAPISchemaObject | OpenAPIReferenceObject
export type OpenAPISchemas = Record<string, OpenAPISchema>

export const isRef = (s: OpenAPISchema): s is OpenAPIReferenceObject => '$ref' in s
export const isSchemaObject = (s: OpenAPISchema): s is OpenAPISchemaObject => !isRef(s)
export const getRefName = (ref: string) => ref.split('/').pop()!

/** Convert object to compact string, e.g. { min: 1, max: 10 } */
export const toObjStr = (obj: Record<string, unknown>) => {
  const props = Object.entries(obj)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  return `{ ${props.join(', ')} }`
}
