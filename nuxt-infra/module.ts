import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions as DayjsOptions } from 'dayjs-nuxt'
import defu from 'defu'
import type { ModuleOptions as NuxtOgImageOptions } from 'nuxt-og-image'
import { VineVitePlugin } from 'vue-vine/vite'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/nuxt-infra'
  },

  hooks: {
    'prepare:types': ({ references }) => {
      references.push({
        types: '@workspace-hmeqo/common/types'
      })
    }
  },

  moduleDependencies: {
    '@nuxt/fonts': {},
    '@nuxt/eslint': {},
    '@nuxt/test-utils': {},
    '@nuxtjs/seo': {},
    '@nuxtjs/device': {},
    'dayjs-nuxt': {
      defaults: <Partial<DayjsOptions>>{
        locales: ['en', 'zh-cn'],
        plugins: ['relativeTime', 'utc', 'timezone', 'quarterOfYear'],
        defaultLocale: 'zh-cn',
        defaultTimezone: 'Asia/Shanghai'
      }
    },
    'nuxt-og-image': {
      defaults: <Partial<NuxtOgImageOptions>>{
        enabled: false
      }
    },
    '@vueuse/nuxt': {},
    '@pinia/nuxt': {},
    'pinia-plugin-persistedstate/nuxt': {},
    '@workspace-hmeqo/nuxt-color-mode': {},
    '@workspace-hmeqo/nuxt-web-kit': {}
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components')
    })

    addPlugin(resolver.resolve('./plugins/error.ts'))

    // Add composables
    addImportsDir(resolver.resolve('./composables'))

    // Add stores
    addImportsDir(resolver.resolve('./stores'))

    // Add utils
    addImportsDir(resolver.resolve('./utils'))
  }
})
