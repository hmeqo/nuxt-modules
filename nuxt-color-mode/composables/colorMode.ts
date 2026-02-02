type ColorMode = 'dark' | 'light'

type ColorModePreference = ColorMode | 'system'

const useNuxtColorMode = defineCachedFn(useColorMode)

export const useColorModeApi = defineCachedFn(() => {
  const colorModePreference = computed({
    get: () => useNuxtColorMode().preference as ColorModePreference,
    set: (v) => {
      const nuxtColorMode = useNuxtColorMode()
      nuxtColorMode.preference = v
    },
  })

  const colorMode = computed({
    get: () => useNuxtColorMode().value as ColorMode,
    set: (v) => {
      colorModePreference.value = v
    },
  })

  const darkMode = computed({
    get: () => colorMode.value === 'dark',
    set: (v) => {
      colorMode.value = v ? 'dark' : 'light'
    },
  })

  return {
    colorModePreference,
    colorMode,
    darkMode,
  }
})
