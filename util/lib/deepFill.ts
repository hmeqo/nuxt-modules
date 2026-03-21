/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 递归填充：如果 target 的值为 null 或 undefined，则使用 source 的对应值
 */
export function deepFill<T>(target: T, source: T | null): T {
  // 如果 source 没值，直接返回 target
  if (source == null) return target

  // 确保 target 是对象，否则无法递归
  if (typeof target !== 'object' || target === null) {
    return target ?? source
  }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const targetVal = target[key as keyof T]
      const sourceVal = source[key]

      if (targetVal === null || targetVal === undefined) {
        // 情况 A: target 没值，直接拿 source 的值（包含 source 的子树）
        target[key as keyof T] = sourceVal as any
      } else if (
        typeof targetVal === 'object' &&
        typeof sourceVal === 'object' &&
        !Array.isArray(targetVal) // 数组通常建议直接覆盖，不建议递归合并元素
      ) {
        // 情况 B: 两者都是对象，递归向下查找
        deepFill(targetVal, sourceVal as any)
      }
    }
  }
  return target
}
