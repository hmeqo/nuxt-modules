<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { defu } from 'defu'
import { darkTheme, lightTheme, type GlobalThemeOverrides } from 'naive-ui'
import { useNaiveConfig } from '../../lib/naive-config'

const props = defineProps<{
  forceColorMode?: 'light' | 'dark'
  themeOverrides?: GlobalThemeOverrides
}>()

const { colorMode } = useNaiveColorMode()
const runtimeConfig = useRuntimeConfig().public.naiveui as any
const deviceTheme = getDeviceTheme()
const naiveTheme = computed(() => getTheme())
const key = ref(1)

useHead(() => ({
  htmlAttrs: {
    class: colorMode.value === 'dark' ? 'dark' : ''
  },
  bodyAttrs: {
    style: {
      'background-color': naiveTheme.value?.common?.bodyColor,
      color: naiveTheme.value?.common?.textColorBase,
      'font-family': naiveTheme.value?.common?.fontFamily,
      'font-size': naiveTheme.value?.common?.fontSize,
      'line-height': naiveTheme.value?.common?.lineHeight
    }
  }
}))

onMounted(() => {
  const isPrerendered = typeof useNuxtApp().payload.prerenderedAt === 'number'

  if (isPrerendered && naiveTheme.value) {
    key.value++
  }
})

function getTheme() {
  const theme = defu(props.themeOverrides, runtimeConfig.themeConfig.shared, deviceTheme)
  if (runtimeConfig.spaLoadingTemplate) {
    setLoadingTemplateTheme(theme)
  }
  return theme
}

function getDeviceTheme() {
  const { isMobileOrTablet, isMobile } = useNaiveDevice()

  if (isMobileOrTablet) {
    return runtimeConfig.themeConfig.mobileOrTablet
  } else if (isMobile) {
    return defu(runtimeConfig.themeConfig.mobile, runtimeConfig.themeConfig.mobileOrTablet)
  }
}

function setLoadingTemplateTheme(theme?: any) {
  if (import.meta.client) {
    const setLocalStorageItem = (key: string, value?: string) => {
      if (value) localStorage.setItem(key, value)
      else localStorage.removeItem(key)
    }
    setLocalStorageItem('naive-body-bg-color', theme?.common?.bodyColor)
    setLocalStorageItem('naive-primary-color', theme?.common?.primaryColor)
  }
}

const { locale, dateLocale } = useNaiveConfig()
</script>

<template>
  <NConfigProvider
    :key="key"
    :class="forceColorMode === 'dark' || colorMode === 'dark' ? 'dark' : 'light'"
    :theme="
      forceColorMode === 'light' || (!(forceColorMode === 'dark') && colorMode === 'light') ? lightTheme : darkTheme
    "
    :theme-overrides="naiveTheme"
    :locale="locale"
    :date-locale="dateLocale"
    inline-theme-disabled
  >
    <slot />
  </NConfigProvider>
</template>
