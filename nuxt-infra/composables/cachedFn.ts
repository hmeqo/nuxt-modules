let fId = 0
const cachedFnResultMap: Record<number, unknown> = {}

export const defineCachedFn = <A extends unknown[], R>(
  fn: (...args: A) => R
): ((...args: A) => R) => {
  const id = ++fId
  return (...args: A) => {
    if (id in cachedFnResultMap) return cachedFnResultMap[id] as R
    const result = fn(...args)
    cachedFnResultMap[id] = result
    return result
  }
}
