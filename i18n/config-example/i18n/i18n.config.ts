import en from './locales/en'
import zhHans from './locales/zh-hans'

export default defineI18nConfig(() => ({
  messages: {
    'zh-hans': zhHans,
    en: en
  }
}))
