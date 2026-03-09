import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type OpenAPISchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject
export type OpenAPIReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject

export type OpenAPISchema = OpenAPISchemaObject | OpenAPIReferenceObject
export type OpenAPISchemas = Record<string, OpenAPISchema>

export const isRef = (s: OpenAPISchema): s is OpenAPIReferenceObject => '$ref' in s
export const isSchemaObject = (s: OpenAPISchema): s is OpenAPISchemaObject => !isRef(s)
export const isEnum = (s: OpenAPISchema): boolean => isSchemaObject(s) && 'enum' in s
export const getRefName = (ref: string) => ref.split('/').pop()!

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

export const defaultFnName = (schemaName: string) => `default${getTypeName(schemaName)}`

/** Convert object to compact string, e.g. { min: 1, max: 10 } */
export const toObjStr = (obj: Record<string, unknown>) => {
  const props = Object.entries(obj)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  return `{ ${props.join(', ')} }`
}
