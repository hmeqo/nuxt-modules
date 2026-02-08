import { StyleProvider, Themes } from '@varlet/ui'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const { darkMode } = useThemeMode()

    watch(
      darkMode,
      (v) => {
        if (v) StyleProvider(Themes.dark)
        else StyleProvider(null)
      },
      { immediate: true },
    )
  })
})
