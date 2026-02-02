/// <reference types="node" />

import { createPlugin } from '@alova/wormhole/plugin'
import fs from 'node:fs'
import path from 'node:path'
import type { OpenAPIV3 } from 'openapi-types'
import {
  getRefName,
  isRef,
  isSchemaObject,
  type OpenAPISchema,
  type OpenAPISchemaObject,
  type OpenAPISchemas,
} from '../util/openapi'

export interface DefaultsPluginOpts {
  filter?: (name: string, schema: OpenAPISchema) => boolean
  customDefaultExpr?: (key: string, schema: OpenAPISchemaObject) => string | undefined
  fileFieldNames?: string[]
}

interface GenContext {
  opts?: DefaultsPluginOpts
  enumFieldNames: string[]
  isOptionalBlock: boolean
}

const RUNTIME_HELPER_CODE = `import { dateString, timeString } from '@workspace-hmeqo/util/lib/date'
import type Types from './globals'

const defineDefault = <T>(
  baseFields: (fillAll: boolean) => T,
  optionalFields?: () => Partial<T>
) => {
  function def(opts?: { fillAll: true; override?: Partial<T> }): Required<T>
  function def(opts?: { fillAll?: boolean; override?: Partial<T> }): T
  function def(override?: Partial<T>): T
  function def(optsOrOverride?: { fillAll?: boolean; override?: Partial<T> }): T {
    const isOpts = optsOrOverride && 'fillAll' in optsOrOverride
    const fillAll = isOpts ? (optsOrOverride.fillAll ?? false) : false
    const override = isOpts ? optsOrOverride.override : optsOrOverride

    return {
      ...baseFields(fillAll),
      ...(fillAll && optionalFields ? optionalFields() : undefined),
      ...override,
    } as T
  }
  return def
}
`

const defaultFnName = (schemaName: string) => `default${schemaName[0].toUpperCase()}${schemaName.slice(1)}`

const getPrimitiveDefault = (name: string, schema: OpenAPISchemaObject, opts?: DefaultsPluginOpts): string => {
  if (opts?.customDefaultExpr) {
    const userDef = opts?.customDefaultExpr(name, schema)
    if (userDef !== undefined) return userDef
  }

  if (schema.default !== undefined) return JSON.stringify(schema.default)
  if ((schema as OpenAPIV3.SchemaObject).nullable) return 'null'
  if (schema.type?.includes('null')) return 'null'
  if (opts?.fileFieldNames?.includes(name) || schema.format === 'binary') return 'new Blob([])'
  if (schema.enum?.length) return JSON.stringify(schema.enum[0])

  switch (schema.type) {
    case 'string':
      switch (schema.format) {
        case 'date-time':
          return 'new Date().toISOString()'
        case 'date':
          return 'dateString()'
        case 'time':
          return 'timeString()'
        case 'uuid':
          return 'crypto.randomUUID()'
        default:
          return "''"
      }
    case 'number':
    case 'integer':
      if (schema.format === 'unix-time') {
        return 'Date.now()'
      }
      return '0'
    case 'boolean':
      return 'false'
    case 'array':
      return '[]'
    case 'object':
      return '{}'
    default:
      return 'undefined'
  }
}

// 核心逻辑：区分 BaseBlock (依赖 fillAll 变量) 和 OptionalBlock (强制 fillAll=true)
const generateFieldValue = (fieldName: string, schema: OpenAPISchema, ctx: GenContext): string => {
  if (isRef(schema)) {
    const refName = getRefName(schema.$ref)
    if (ctx.enumFieldNames.includes(refName)) {
      return `${defaultFnName(refName)}()`
    }
    // 如果在 optional 块中，递归调用默认开启 fillAll
    if (ctx.isOptionalBlock) {
      return `${defaultFnName(refName)}({ fillAll: true })`
    }
    return `${defaultFnName(refName)}({ fillAll })`
  }

  if (isSchemaObject(schema)) {
    const firstOf = schema.allOf?.[0] ?? schema.anyOf?.[0] ?? schema.oneOf?.[0]
    if (firstOf) return generateFieldValue(fieldName, firstOf, ctx)

    if (schema.enum?.length) return JSON.stringify(schema.enum[0])
    if (schema.type === 'object') return '{}'
    if (schema.type === 'array') return '[]'
    return getPrimitiveDefault(fieldName, schema, ctx.opts)
  }

  return 'undefined'
}

export const defaultsPlugin = createPlugin((outputDir: string, opts?: DefaultsPluginOpts) => ({
  afterOpenapiParse(document) {
    const schemas: OpenAPISchemas = document.components?.schemas ?? {}
    if (!schemas || Object.keys(schemas).length === 0) return

    let code = RUNTIME_HELPER_CODE
    const enumFieldNames: string[] = []

    // 1. 生成 Enum
    for (const [name, schema] of Object.entries(schemas)) {
      if (!isSchemaObject(schema)) continue
      if (opts?.filter && !opts.filter(name, schema)) continue

      if (schema.enum?.length) {
        code += `
export const ${defaultFnName(name)} = (): Types.${name} => ${JSON.stringify(schema.enum[0])}
`
        enumFieldNames.push(name)
      }
    }

    // 2. 生成 Object
    for (const [name, schema] of Object.entries(schemas)) {
      if (!isSchemaObject(schema)) continue
      if (opts?.filter && !opts.filter(name, schema)) continue
      if (enumFieldNames.includes(name)) continue

      if (schema.type === 'object' && schema.properties) {
        const requiredKeys = new Set(schema.required ?? [])
        const baseLines: string[] = []
        const optionalLines: string[] = []

        for (const [fieldName, prop] of Object.entries(schema.properties)) {
          const isRequired = requiredKeys.has(fieldName)
          const fieldValue = generateFieldValue(fieldName, prop, {
            opts,
            enumFieldNames,
            isOptionalBlock: !isRequired,
          })

          const line = `${fieldName}: ${fieldValue}`
          if (isRequired) baseLines.push(line)
          else optionalLines.push(line)
        }

        code += `
export const ${defaultFnName(name)} = defineDefault<Types.${name}>(
  (fillAll) => ({
${baseLines.map((l) => `    ${l}`).join(',\n')}
  }),
  () => ({
${optionalLines.map((l) => `    ${l}`).join(',\n')}
  })
)
`
      }
    }

    const out = path.join(outputDir, 'defaults.ts')
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, code)
  },
}))
