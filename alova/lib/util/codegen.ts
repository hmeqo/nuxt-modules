/// <reference types="node" />

/**
 * 代码生成工具函数（供 defaults/pick 插件共用）
 */

import fs from 'node:fs'
import path from 'node:path'

// ─── 文件写出 ─────────────────────────────────────────────────────────────────

/**
 * 将生成的代码写入目标文件，自动创建上级目录
 */
export const writeGeneratedFile = (outputDir: string, filename: string, code: string): void => {
  const outPath = path.join(outputDir, filename)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, code)
}

// ─── 缩进 ─────────────────────────────────────────────────────────────────────

export const indent = (n: number) => ' '.repeat(n)

// ─── If 链生成 ────────────────────────────────────────────────────────────────

/**
 * 生成 discriminated union 的 if 链代码块
 *
 * 倒序遍历变体：最后一个（原第一个）变体不加 if 条件，直接 return 作为 fallback。
 *
 * @param items 变体列表（顺序与原始 variants 一致）
 * @param buildCond 生成 if 条件表达式，如 `obj?.type === "coil"`
 * @param buildReturn 生成 return 表达式体
 * @param indentSize 缩进空格数，默认 4
 */
export const buildIfChain = <T>(
  items: T[],
  buildCond: (item: T) => string,
  buildReturn: (item: T) => string,
  indentSize = 4,
): string => {
  const pad = indent(indentSize)
  return [...items]
    .reverse()
    .map((item, i) => {
      const ret = `return ${buildReturn(item)}`
      if (i === items.length - 1) return `${pad}${ret}`
      return `${pad}if (${buildCond(item)}) { ${ret} }`
    })
    .join('\n')
}
