export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const { colorMode } = useThemeMode()

    watch(
      colorMode,
      (v) => {
        useNaiveColorMode().colorMode.value = v
      },
      {
        immediate: true,
      },
    )
  })
})
