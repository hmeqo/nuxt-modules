type ColorMode = 'dark' | 'light'

type ColorModePreference = ColorMode | 'system'

const cache: {
  nuxtColorMode?: ReturnType<typeof useColorMode>
  colorModeApi?: {
    colorModePreference: WritableComputedRef<ColorModePreference>
    colorMode: WritableComputedRef<ColorMode>
    darkMode: WritableComputedRef<boolean>
  }
} = {}

const useNuxtColorMode = () => (cache.nuxtColorMode ??= useColorMode())

export const useColorModeApi = () => {
  if (cache.colorModeApi) return cache.colorModeApi

  const colorModePreference = computed({
    get: () => useNuxtColorMode().preference as ColorModePreference,
    set: (v) => {
      const nuxtColorMode = useNuxtColorMode()
      nuxtColorMode.preference = v
    }
  })

  const colorMode = computed({
    get: () => useNuxtColorMode().value as ColorMode,
    set: (v) => {
      colorModePreference.value = v
    }
  })

  const darkMode = computed({
    get: () => colorMode.value === 'dark',
    set: (v) => (colorMode.value = v ? 'dark' : 'light')
  })

  return (cache.colorModeApi = {
    colorModePreference,
    colorMode,
    darkMode
  })
}
