import { dateEnUS, dateZhCN, enUS, zhCN } from 'naive-ui'

export const useNaiveConfig = () => {
  const { locale } = useNuxtApp().$i18n

  const naiveDateLocale = computed(() => {
    switch (locale.value) {
      case 'en':
        return dateEnUS
      case 'zh-hans':
        return dateZhCN
    }
  })
  const naiveLocale = computed(() => {
    switch (locale.value) {
      case 'en':
        return enUS
      case 'zh-hans':
        return zhCN
    }
  })

  return {
    dateLocale: naiveDateLocale,
    locale: naiveLocale,
  }
}
