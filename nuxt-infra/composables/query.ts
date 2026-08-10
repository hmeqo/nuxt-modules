/* eslint-disable @typescript-eslint/no-dynamic-delete */
/**
 * URL 状态绑定 composable。
 *
 * 核心引擎 = @vueuse/router 的 useRouteQuery / useRouteParams（社区维护的双向同步：
 * 读随 route 变化——前进/后退/外部改 URL 自动反映；写回批量 replace、置回默认自动删 key）。
 * 外层补本项目特性：多 key 别名、validate、showError、fallback、default。
 *
 * Examples:<br/>
 * useQueryInt('page', { default: () => 1, validate: (v) => v > 0 })<br/>
 * useQueryInt('page', { showError: true }) // throw error if query is not found<br/>
 * useQueryInt('page', { fallback: '/login' }) // redirect to /login if query is not found
 * useQueryInt(['page', 'p'], { default: () => 1 }) // query 'page' has higher priority
 */

import { useRouteParams, useRouteQuery } from '@vueuse/router'
import type { RouteLocationNormalizedLoaded, RouteParamValueRaw } from 'vue-router'

// vue-router 5 移除了 RouteQueryValueRaw 导出，本地等价类型
type RawQueryValue = RouteParamValueRaw | string[]

type Opts<T> = {
  /**
   * Get default value if query string is not found or parse error
   * @default undefined
   */
  default?: () => T
  /**
   * Customize route
   * @default useRoute()
   */
  route?: RouteLocationNormalizedLoaded
  /**
   * Throw error if query is not found
   * @default false
   */
  showError?: boolean
  /**
   * Redirect to this path if query is not found
   * @default undefined
   */
  fallback?: string
  /**
   * Validate query
   * @default undefined
   */
  validate?: (v: T) => boolean
}

type Serializer<T> = { in: (v: unknown) => T | undefined; out: (v: unknown) => string }

const StringSerializer: Serializer<string> = {
  in: (v) => (v == null ? undefined : `${v}`),
  out: (v) => `${v}`,
}

const NumberSerializer: Serializer<number> = {
  in: (v) => {
    const value = Number.parseInt(`${v}`)
    if (Number.isNaN(value)) return
    return value
  },
  out: (v) => `${v}`,
}

export function toAutoController<T>({
  data,
  errorMessage,
  opts,
}: {
  data: Ref<T | undefined>
  errorMessage: () => string
  opts?: Opts<T>
}) {
  if (data.value === undefined) {
    const error = createError({ statusCode: 404, statusMessage: errorMessage() })
    if (opts?.showError) {
      showError(error)
      throw error
    }
    if (opts?.fallback) {
      navigateTo(opts.fallback)
      throw error
    }
  }
  return data
}

function parseWith<T>(serializer: Serializer<T>, opts: Opts<T> | undefined, raw: unknown): T | undefined {
  const parsed = serializer.in(raw)
  if (parsed === undefined || opts?.validate?.(parsed) === false) return undefined
  return parsed
}

function _useQuery<T>(keyOrKeys: string | string[], serializer: Serializer<T>, opts?: Opts<T>) {
  const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]
  const primary = keys[0]!
  const aliases = keys.slice(1)
  const route = (opts?.route || useRoute()) as RouteLocationNormalizedLoaded
  const router = useRouter()
  const def = opts?.default?.()

  // 主 key 读引擎：@vueuse/router 维护的 customRef + watch（读随 route 变化，见 useRouteQuery 实现）
  const engine = useRouteQuery<RawQueryValue, T | undefined>(primary, undefined, {
    route,
    transform: {
      get: (v) => parseWith(serializer, opts, v),
    },
  })

  const data = computed<T | undefined>({
    get: () => {
      // 主 key 优先（文档语义），别名兜底；主 key 缺失/不可解析时回退别名
      const primaryVal = engine.value
      if (primaryVal !== undefined) return primaryVal
      for (const key of aliases) {
        if (key in route.query) {
          const parsed = parseWith(serializer, opts, route.query[key])
          if (parsed !== undefined) return parsed
        }
      }
      return def
    },
    set: (v) => {
      // 统一构造新 query 一次 replace：
      // - 清全部 keys（含别名）→ 避免残留别名在主 key 删除后复活旧值
      // - v === undefined / v === def → 不写（删 key / 回默认清理），VueUse 语义
      // - 引擎的写队列表达不了删除/别名清理，这里补薄层（见 F1/F3/F4 review）
      const query = { ...route.query }
      for (const key of keys) delete query[key]
      if (v !== undefined && v !== def) query[primary] = serializer.out(v)
      router.replace({ query })
    },
  })

  return toAutoController({
    data,
    errorMessage: () => `Cannot parse ${keyOrKeys}: ${route.query[primary]}`,
    opts,
  })
}

function _usePathParam<T>(key: string, serializer: Serializer<T>, opts?: Opts<T>) {
  const route = (opts?.route || useRoute()) as RouteLocationNormalizedLoaded

  const data = useRouteParams<RouteParamValueRaw, T | undefined>(key, undefined, {
    route,
    transform: (v) => parseWith(serializer, opts, v),
  })

  return toAutoController({
    data,
    errorMessage: () => `Cannot parse path param ${key}: ${route.params[key as keyof typeof route.params]}`,
    opts,
  })
}

export function toUseQuery<A>(serializer: Serializer<A>) {
  function useQuery<T = A>(
    key: string | string[],
    opts: Opts<T> & ({ default: () => T } | { showError: true } | { fallback: string }),
  ): Ref<T>
  function useQuery<T = A>(key: string | string[], opts?: Opts<T>): Ref<T | undefined>
  function useQuery(key: string | string[], opts?: Opts<A>) {
    return _useQuery<A>(key, serializer, opts)
  }
  return useQuery
}

export function toUsePathParam<A>(serializer: Serializer<A>) {
  function usePathParam<T = A>(
    key: string,
    opts: Opts<T> & ({ default: () => T } | { showError: true } | { fallback: string }),
  ): Ref<T>
  function usePathParam<T = A>(key: string, opts?: Opts<T>): Ref<T | undefined>
  function usePathParam(key: string, opts?: Opts<A>) {
    return _usePathParam<A>(key, serializer, opts)
  }
  return usePathParam
}

export const useQueryStr = toUseQuery(StringSerializer)

export const useQueryInt = toUseQuery(NumberSerializer)

export const usePathParamStr = toUsePathParam(StringSerializer)

export const usePathParamInt = toUsePathParam(NumberSerializer)
