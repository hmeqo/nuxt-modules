export default defineNuxtPlugin((nuxtApp) => {
  const { locale, availableLocales, defaultLocale } = useNuxtApp().$i18n

  const langCookie = useLangCookie({ default: () => defaultLocale })

  if (!availableLocales.includes(langCookie.value)) langCookie.value = defaultLocale
  locale.value = langCookie.value

  watch(locale, (newLocale) => (langCookie.value = newLocale))
  watch(langCookie, (newCookie) => (locale.value = newCookie))
})
