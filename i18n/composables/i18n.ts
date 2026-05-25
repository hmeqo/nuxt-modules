import type { Composer, Locale } from 'vue-i18n'

export const $t: Composer['t'] = ((...args: any[]) => (useCachedI18n() as any).t(...args)) as any

export const useCachedI18n = defineCachedFn(() => {
  return useI18n()
})

export const useLangCookie = <T = Locale>(opts?: { default?: () => T }) => {
  const cookieKey = useRuntimeConfig().public.i18n?.cookieKey || 'language'
  return useCookie<T>(cookieKey, { maxAge: 60 * 60 * 24 * 3650, default: opts?.default })
}

export const useCachedLocalePath = defineCachedFn(() => {
  return useLocalePath()
})

export const $localePath = (...opts: Parameters<ReturnType<typeof useLocalePath>>) => {
  return useCachedLocalePath()(...opts)
}
