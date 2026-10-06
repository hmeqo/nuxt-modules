type ColorMode = 'dark' | 'light'

type ColorModePreference = ColorMode | 'system'

const useNuxtColorMode = defineCachedFn(useColorMode)

export const useThemeMode = defineCachedFn(() => {
  const nuxtColorMode = useNuxtColorMode()

  const colorModePreference = computed({
    get: () => nuxtColorMode.preference as ColorModePreference,
    set: (v) => {
      nuxtColorMode.preference = v
    },
  })

  const colorMode = computed({
    get: () =>
      colorModePreference.value === 'system' ? (nuxtColorMode.value as ColorMode) : colorModePreference.value,
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
