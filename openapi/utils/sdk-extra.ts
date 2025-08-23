/* eslint-disable @typescript-eslint/no-explicit-any */

import { getSdk } from '..'

export type SchemaPropValue = {
  type?: 'string' | 'number' | 'boolean' | 'all-of' | (string & {})
  isRequired?: boolean
  isReadOnly?: boolean
  isNullable?: boolean
  maxLength?: number
  minLength?: number
  minimum?: number
  maximum?: number
  description?: string
  pattern?: string
  format?: string
  contains?: unknown
}

export type Schema = {
  type?: string
  properties: Record<string, SchemaPropValue>
}

export const schemaToDefaults = <T>(
  schema: Schema,
  overrides?: Partial<T>,
  opts?: { type?: string; forceRequired?: boolean; sdk?: any }
): T => {
  const sdk = opts?.sdk || getSdk()

  if (schema.type && opts?.type) {
    return Object.values(sdk[opts?.type as keyof typeof sdk])[0] as T
  }
  const mix = <K extends keyof T>(
    k: K,
    schema: SchemaPropValue,
    after: (override?: [K, Partial<T>[K]]) => [K, any]
  ) => {
    const override = overrides?.[k]
    if (override !== undefined) return after([k, override])

    if (!schema.type) return
    if (!(opts?.forceRequired || schema.isRequired)) return
    if (schema.isNullable) return [k, null]

    return after()
  }

  return Object.fromEntries(
    (Object.entries(schema.properties) as [keyof T, Schema['properties'][keyof Schema['properties']]][])
      .map(([k, schema]) => {
        const { type, format } = schema

        switch (type) {
          case 'string':
            return mix(k, schema, (override) => {
              if (override) return override
              if (format === 'date-time') return [k, new Date().toISOString()]
              return [k, '']
            })
          case 'number':
            return mix(k, schema, (override) => override ?? [k, 0])
          case 'boolean':
            return mix(k, schema, (override) => override ?? [k, false])
          case 'all-of':
            // TODO: Need to implement
            return mix(k, schema, (override) => override ?? [k, null])
          case 'array':
            return mix(k, schema, (override) => override ?? [k, []])
          case 'dictionary':
            return mix(k, schema, (override) => override ?? [k, {}])
          case 'binary':
            return mix(k, schema, (override) => override ?? [k, new Blob()])
          default: {
            return mix(k, schema, (override) => {
              const subSchema = sdk[`$${type}` as keyof typeof sdk] as Schema
              if (subSchema === undefined) throw new Error(`Unknown type: ${type}`)
              return [
                k,
                schemaToDefaults(subSchema, override?.[1] as any, {
                  type,
                  forceRequired: opts?.forceRequired
                })
              ]
            })
          }
        }
      })
      .filter((x) => x !== undefined)
  )
}
