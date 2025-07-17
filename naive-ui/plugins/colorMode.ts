export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const { colorMode } = useColorModeApi()

    watch(colorMode, (v) => {
      useNaiveColorMode().colorMode.value = v
    })
  })
})
