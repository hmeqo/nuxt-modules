import type { NoPromise } from '../types'

declare module '#app' {
  interface NuxtApp {
    _cachedFn?: Record<symbol, unknown>
  }
}

export const defineCachedFn = <A extends unknown[], R>(fn: (...args: A) => NoPromise<R>): ((...args: A) => R) => {
  const key = Symbol('cachedFn')

  return (...args: A) => {
    const nuxtApp = tryUseNuxtApp()
    if (!nuxtApp) {
      throw new Error('NuxtApp not found')
    }
    // 初始化当前请求的缓存对象
    nuxtApp._cachedFn = nuxtApp._cachedFn || {}
    // 如果当前请求已经执行过该函数，直接返回缓存
    if (key in nuxtApp._cachedFn) {
      return nuxtApp._cachedFn[key] as R
    }
    // 否则执行函数，并将结果存入当前请求的上下文中
    const result = fn(...args)
    return (nuxtApp._cachedFn[key] = result)
  }
}
