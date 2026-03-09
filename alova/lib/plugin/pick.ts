/// <reference types="node" />

import { createPlugin } from '@alova/wormhole/plugin'
import fs from 'node:fs'
import path from 'node:path'
import {
  getRefName,
  isEnum,
  isRef,
  isSchemaObject,
  type OpenAPISchema,
  type OpenAPISchemaObject,
  type OpenAPISchemas,
} from '../util/openapi'

export type PkRule = { pk: string; suffix: string; isArray?: boolean; excludes?: string[] }
export type PickOpts = { filter?: (name: string) => boolean; pk?: PkRule[] }

const RUNTIME_HELPER_CODE = `/* eslint-disable @typescript-eslint/no-explicit-any */
import * as defaults from './defaults'
import type Types from './globals'

const definePick = <T extends object>(
  pickFn: (obj: any, opts?: { fillAll?: boolean }) => Partial<T>,
  pkFn: (obj: any) => Partial<T>,
  defaultFn: (opts?: { fillAll?: boolean }) => T,
) => {
  function pick<O extends Partial<T>>(obj: any, opts?: { fillAll: true; override?: O }): Required<T> & O
  function pick<O extends Partial<T>>(obj: any, opts?: { fillAll?: boolean; override?: O }): T & O
  function pick<O extends Partial<T>>(obj: any, opts?: { fillAll?: boolean; override?: O }): T & O {
    const { fillAll = false, override } = opts ?? {}

    let base
    if (obj === null || obj === undefined) {
      base = defaultFn({ fillAll })
    } else {
      base = pickFn(obj, opts)

      for (const [k, v] of Object.entries(defaultFn({ fillAll }))) {
        if (base[k as keyof T] === undefined) base[k as keyof T] = v
      }

      for (const [k, v] of Object.entries(pkFn(obj))) {
        base[k as keyof T] = (v as T[keyof T]) ?? base[k as keyof T]
      }
    }
    return {
      ...base,
      ...override,
    } as T & O
  }
  return pick
}
`

const pickFnName = (schemaName: string) => `pick${schemaName[0].toUpperCase()}${schemaName.slice(1)}`

// 生成 PK 映射，如 { userId: obj?.user?.id }
const generatePkExpr = (schema: OpenAPISchemaObject, pkRules: PkRule[]): string => {
  const lines: string[] = []
  const properties = Object.keys(schema.properties ?? {})

  for (const key of properties) {
    const rule = pkRules.find((r) => key.endsWith(r.suffix) && !r.excludes?.includes(key))
    if (!rule) continue

    const sourceProp = key.slice(0, -rule.suffix.length)
    if (rule.isArray) {
      lines.push(`${key}: obj?.${sourceProp}?.map((i: any) => i?.${rule.pk})`)
    } else {
      lines.push(`${key}: obj?.${sourceProp}?.${rule.pk}`)
    }
  }

  return lines.length ? `{ ${lines.join(', ')} }` : '{}'
}

// 生成字段取值，处理 Ref 递归和 Array Map
const generateFieldExpr = (fieldName: string, schema: OpenAPISchema, schemas: OpenAPISchemas): string => {
  const access = `obj?.${fieldName}`

  if (isRef(schema)) {
    const refName = getRefName(schema.$ref)
    const target = schemas[refName]
    // 仅对 Object 类型的 Ref 进行递归 Pick，且排除 Enum 类型
    if (target && isSchemaObject(target) && target.type === 'object' && !isEnum(target)) {
      return `${pickFnName(refName)}(${access}, opts)`
    }
    return access
  }

  if (!isSchemaObject(schema)) return access

  // 排除 Enum 类型
  if (isEnum(schema)) return access

  if (schema.type === 'array' && schema.items) {
    const items = schema.items
    if (isRef(items)) {
      const refName = getRefName(items.$ref)
      const target = schemas[refName]
      // 仅对 Object 类型的 Ref 进行递归 Pick，且排除 Enum 类型
      if (target && isSchemaObject(target) && target.type === 'object' && !isEnum(target)) {
        return `${access}?.map((i: any) => ${pickFnName(refName)}(i, opts))`
      }
    }
    return access
  }

  return access
}

export const pickPlugin = createPlugin((outputDir: string, opts?: PickOpts) => ({
  afterOpenapiParse(document) {
    const schemas: OpenAPISchemas = document.components?.schemas ?? {}
    if (!schemas || Object.keys(schemas).length === 0) return

    const pkRules = opts?.pk ?? []
    let code = RUNTIME_HELPER_CODE

    for (const [name, schema] of Object.entries(schemas)) {
      if (opts?.filter && !opts.filter(name)) continue
      if (!isSchemaObject(schema) || schema.type !== 'object' || !schema.properties) continue

      const pkExpr = generatePkExpr(schema, pkRules)
      const fieldLines: string[] = []

      for (const [key, prop] of Object.entries(schema.properties)) {
        fieldLines.push(`${key}: ${generateFieldExpr(key, prop, schemas)}`)
      }

      code += `
export const ${pickFnName(name)} = definePick<Types.${name}>(
  (obj, opts) => ({
${fieldLines.map((l) => `    ${l}`).join(',\n')}
  }),
  (obj) => (${pkExpr}),
  defaults.default${name}
)
`
    }

    const out = path.join(outputDir, 'pick.ts')
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, code)
  },
}))
