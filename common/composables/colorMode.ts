type ColorMode = 'dark' | 'light'

type ColorModePreference = ColorMode | 'system'

const colorModes = ['dark', 'light']

let cached: {
  colorMode: WritableComputedRef<ColorMode>
  darkMode: WritableComputedRef<boolean>
  colorModePreference: WritableComputedRef<ColorModePreference>
}

export const useColorModeApi = () => {
  if (cached) return cached

  const nuxtColorMode = useColorMode()

  if (!colorModes.includes(nuxtColorMode.preference))
    nuxtColorMode.preference = nuxtColorMode.value = detectPreferredColorMode()

  const colorMode = computed({
    get: () => {
      if (import.meta.server) {
        const colorMode = useCookie<ColorMode>('color-mode', { sameSite: 'lax', maxAge: 60 * 60 * 24 * 3650 }).value
        if (colorModes.includes(colorMode)) return colorMode
      }
      return nuxtColorMode.preference as ColorMode
    },
    set: (value) => {
      nuxtColorMode.preference = nuxtColorMode.value = value
    }
  })

  const darkMode = computed({
    get: () => colorMode.value === 'dark',
    set: (value) => {
      colorMode.value = value ? 'dark' : 'light'
    }
  })

  const colorModePreference = computed({
    get: () => nuxtColorMode.preference as ColorModePreference,
    set: (value) => {
      nuxtColorMode.preference = nuxtColorMode.value = value
    }
  })

  return (cached ??= {
    colorMode,
    darkMode,
    colorModePreference
  })
}

function detectPreferredColorMode() {
  if (import.meta.server) {
    const headers = useRequestHeaders()
    return headers['sec-ch-prefers-color-scheme'] === 'dark' ? 'dark' : 'light'
  } else {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
}
