import type { I18nLocale } from '~~/i18n/types'

export const T = new Proxy(
  {},
  {
    get: (_, key) => {
      if (key === '__v_isRef') return false
      return $t(key as string)
    },
  },
) as I18nLocale
