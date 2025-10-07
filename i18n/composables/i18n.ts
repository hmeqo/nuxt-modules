import type { Composer } from 'vue-i18n'

let cachedI18n: Composer

export const useCachedI18n = () => {
  cachedI18n ??= useI18n()
  const { locale, setLocale, availableLocales } = cachedI18n

  const langCookie = useLangCookie({ default: () => locale.value })

  if (langCookie.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (availableLocales.includes(langCookie.value as any)) setLocale((locale.value = langCookie.value)) as any
    else langCookie.value = locale.value
  }
  return cachedI18n
}

export const $t = (key: string | number) => cachedI18n.t(key)

export const useLocale = () => {
  return useCachedI18n().locale
}

export const useLangCookie = <T = string>(opts?: { default?: () => T }) => {
  return useCookie<T>('language', { maxAge: 60 * 60 * 24 * 3650, default: opts?.default })
}
