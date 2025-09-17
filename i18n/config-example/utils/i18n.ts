import type { I18nLocale } from '~~/i18n/types'

export const T = new Proxy(
  {},
  {
    get: (_, key) => useCachedI18n().t(key as string)
  }
) as I18nLocale
