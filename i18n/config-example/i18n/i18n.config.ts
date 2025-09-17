import en from './locales/en'
import zhHans from './locales/zh-hans'

export default defineI18nConfig(() => ({
  messages: {
    'zh-Hans': zhHans,
    en: en
  }
}))
