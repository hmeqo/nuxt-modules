import { dateEnUS, dateZhCN, enUS, zhCN } from 'naive-ui'

export const useNaiveConfig = () => {
  if (typeof useLocale === 'undefined') return {}

  const locale = useLocale()

  const naiveDateLocale = computed(() => {
    switch (locale.value) {
      case 'en':
        return dateEnUS
      case 'zh-Hans':
        return dateZhCN
    }
  })
  const naiveLocale = computed(() => {
    switch (locale.value) {
      case 'en':
        return enUS
      case 'zh-Hans':
        return zhCN
    }
  })

  return {
    dateLocale: naiveDateLocale,
    locale: naiveLocale
  }
}
