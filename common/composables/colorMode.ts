import type { CookieRef } from '#app'

type ColorMode = 'dark' | 'light'

type ColorModePreference = ColorMode | 'system'

const defaultColorMode: ColorMode = 'light'
const colorModes: ColorMode[] = ['dark', 'light']
const colorModePreferences: ColorModePreference[] = [...colorModes, 'system']

const cache: {
  colorModePreference?: CookieRef<ColorModePreference>
  nuxtColorMode?: ReturnType<typeof useColorMode>
  colorModeApi?: {
    colorModePreference: WritableComputedRef<ColorModePreference>
    colorMode: WritableComputedRef<ColorMode>
    darkMode: WritableComputedRef<boolean>
  }
} = {}

const useColorModeCookie = () => {
  if (cache.colorModePreference) return cache.colorModePreference

  const colorModePreference = useCookie<ColorModePreference>('color-mode', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 3650
  })
  const nuxtColorMode = useNuxtColorMode()

  // Initialize
  if (!colorModePreferences.includes(colorModePreference.value)) colorModePreference.value = detectPreferredColorMode()
  nuxtColorMode.preference = colorModePreference.value
  nuxtColorMode.value = preferenceToColorMode(colorModePreference.value)

  return colorModePreference
}

const useNuxtColorMode = () => (cache.nuxtColorMode ??= useColorMode())

const preferenceToColorMode = (preference: ColorModePreference) =>
  preference === 'system' ? detectPreferredColorMode() : preference

const detectPreferredColorMode = () => {
  if (import.meta.server) {
    const headers = useRequestHeaders()
    const raw = headers['sec-ch-prefers-color-scheme'] || headers['x-color-scheme-preference']
    const value = (Array.isArray(raw) ? raw[0] : raw)?.toString().trim().toLowerCase()
    const mode: ColorMode | undefined = value === 'dark' ? 'dark' : value === 'light' ? 'light' : undefined

    return mode ?? defaultColorMode
  } else {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
}

export const useColorModeApi = () => {
  if (cache.colorModeApi) return cache.colorModeApi

  const colorModePreference = computed({
    get: () => useColorModeCookie().value,
    set: (v) => {
      const colorModeCookie = useColorModeCookie()
      const nuxtColorMode = useNuxtColorMode()
      colorModeCookie.value = nuxtColorMode.preference = v
      nuxtColorMode.value = preferenceToColorMode(v)
    }
  })

  const colorMode = computed({
    get: () => preferenceToColorMode(colorModePreference.value),
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
