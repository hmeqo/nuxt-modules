import type { ModuleOptions } from '../../types'
import { hasPermission, type Permission } from './base'

type RouteTo =
  | string
  | {
      /**
       * url to navigate
       */
      path: string
      /**
       * redirect to url instead of navigation
       * @default false
       */
      redirect?: boolean
    }

type RouteCase = {
  /**
   * authentication permissions
   * @default undefined
   */
  auth: Permission[]
  /**
   * route to url when authentication succeeds
   * @default undefined
   */
  to?: RouteTo
  /**
   * whether to continue verifying other permissions when authentication succeeds
   * @default false
   */
  continueVerify?: boolean
}

type RouteAuthOptions = {
  /**
   * fallback url when authentication fails
   * @default undefined
   */
  fallback?: RouteTo
  /**
   * throw error if all authentication fails
   * @default false
   */
  showError?: boolean
}

function redirectTo(to: string) {
  if (!to.startsWith('http')) to = `${location.origin}${to}`
  location.href = to
}

function routeTo(to: RouteTo) {
  const runtimeConfig = useRuntimeConfig().public as ModuleOptions
  if (typeof to === 'object') {
    const { path, redirect } = to
    if (redirect) return redirectTo(path)
    if (runtimeConfig.routeAuth?.defaultRedirect) return redirectTo(path)
    return navigateTo(path)
  }
  if (runtimeConfig.routeAuth?.defaultRedirect) return redirectTo(to)
  return navigateTo(to)
}

export async function routeAuth(cases: RouteCase[], routeAuthOptions?: RouteAuthOptions) {
  const { fallback, showError } = routeAuthOptions || {}
  for (const { auth: permissions, to, continueVerify } of cases) {
    if (hasPermission(...permissions)) {
      if (to) return routeTo(to)
      if (continueVerify !== true) return
    }
  }
  if (fallback) return routeTo(fallback)
  if (showError) throw createError({ statusCode: 403 })
}
