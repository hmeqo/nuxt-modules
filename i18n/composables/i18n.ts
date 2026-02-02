import type { Locale } from 'vue-i18n'

export const $t = (key: string | number) => useCachedI18n().t(key)

export const useCachedI18n = defineCachedFn(() => {
  return useI18n()
})

export const useLangCookie = <T = Locale>(opts?: { default?: () => T }) => {
  // @ts-expect-error cookieKey may not exist
  const cookieKey = useRuntimeConfig().public.i18n?.cookieKey || 'language'
  return useCookie<T>(cookieKey, { maxAge: 60 * 60 * 24 * 3650, default: opts?.default })
}

export const useCachedLocalePath = defineCachedFn(() => {
  return useLocalePath()
})

export const $localePath = (...opts: Parameters<ReturnType<typeof useLocalePath>>) => {
  return useCachedLocalePath()(...opts)
}
