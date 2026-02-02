/// <reference types="node" />

import { createPlugin } from '@alova/wormhole/plugin'
import fs from 'node:fs'
import path from 'node:path'
import type { OpenAPIV3 } from 'openapi-types'
import { isRef, isSchemaObject, toObjStr, type OpenAPISchemaObject, type OpenAPISchemas } from '../util/openapi'

export type RulesOpts = { filter?: (name: string) => boolean }

const schemaFnName = (schemaName: string) => `rules${schemaName[0]?.toUpperCase()}${schemaName.slice(1)}`

export const valibotToNaiveRulesPlugin = createPlugin((outputDir: string, opts?: RulesOpts) => ({
  afterOpenapiParse(document) {
    const schemas: OpenAPISchemas = document.components?.schemas ?? {}
    if (!schemas) return

    let code = `import { valibotToRules } from '@workspace-hmeqo/alova/lib/util/valibot-rules'
import type { ObjectEntries, ObjectSchema } from 'valibot'
import * as v from './gen/valibot.gen'

const defineRules =
  <T extends ObjectEntries>(schema: ObjectSchema<T, undefined>) =>
  (overrides?: Required<Parameters<typeof valibotToRules<T>>>['1']['overrides']) =>
    valibotToRules(schema, { overrides })
`

    for (const [name, schema] of Object.entries(schemas)) {
      if (opts?.filter && !opts.filter(name)) continue
      if (!isSchemaObject(schema) || schema.type !== 'object' || !schema.properties) continue

      code += `
export const ${schemaFnName(name)} = defineRules(v.v${name})
`
    }

    const out = path.join(outputDir, 'rules.ts')
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, code)
  },
}))

const codeGenOpenApiToNaiveRules = (schema: OpenAPISchemaObject): string => {
  if (!schema.properties) return '{}'

  const lines: string[] = []
  // OpenAPI 的 required 定义在父级
  const requiredSet = new Set(schema.required || [])

  for (const [propName, prop] of Object.entries(schema.properties as Record<string, OpenAPISchemaObject>)) {
    // 暂时忽略引用类型，因无法确定内部约束
    if (isRef(prop)) continue

    const rules: string[] = []

    // 处理 Required
    // 对应 naiveRulePresets.notUndefined()
    if (requiredSet.has(propName)) {
      rules.push(`naiveRulePresets.notUndefined()`)
    }

    // 处理 Nullable
    // OpenAPI 默认为 nullable: false。如果不允许为 null，则添加 notNull 规则
    // 对应 naiveRulePresets.notNull()
    if (!prop.type?.includes('null') && (prop as OpenAPIV3.SchemaObject).nullable !== true) {
      rules.push(`naiveRulePresets.notNull()`)
    }

    // 处理长度 (Length)
    // 对应 naiveRulePresets.length({ min, max })
    if (prop.minLength !== undefined || prop.maxLength !== undefined) {
      rules.push(`naiveRulePresets.length(${toObjStr({ min: prop.minLength, max: prop.maxLength })})`)
    }

    // 处理数值范围 (Number)
    if (prop.minimum !== undefined || prop.maximum !== undefined) {
      rules.push(`naiveRulePresets.number(${toObjStr({ min: prop.minimum, max: prop.maximum })})`)
    }

    // 处理正则 (Pattern)
    if (prop.pattern !== undefined) {
      rules.push(`naiveRulePresets.pattern(${toObjStr({ pattern: prop.pattern })})`)
    }

    // 如果该字段有规则，则添加到对象字符串中
    if (rules.length > 0) {
      lines.push(`${propName}: [${rules.join(', ')}]`)
    }
  }

  // 格式化输出
  return `{\n${lines.map((l) => `  ${l}`).join(',\n')}\n}`
}

export const naiveRulesPlugin = createPlugin((outputDir: string, opts?: RulesOpts) => ({
  afterOpenapiParse(document) {
    const schemas: OpenAPISchemas = document.components?.schemas ?? {}
    if (!schemas) return

    const presetPath = '@workspace-hmeqo/naive-ui/utils/rules'
    let code = `import { naiveRulePresets } from '${presetPath}'
`

    for (const [name, schema] of Object.entries(schemas)) {
      if (opts?.filter && !opts.filter(name)) continue

      if (!isSchemaObject(schema) || schema.type !== 'object' || !schema.properties) continue

      const rulesCode = codeGenOpenApiToNaiveRules(schema)

      code += `
export const ${schemaFnName(name)} = ${rulesCode}
`
    }

    const out = path.join(outputDir, 'rules.ts')
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, code)
  },
}))
