import type { ModuleOptions as NuxtIconOptions } from '@nuxt/icon'
import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions as DayjsOptions } from 'dayjs-nuxt'
import type { ModuleOptions as NuxtOgImageOptions } from 'nuxt-og-image'

export default defineNuxtModule({
  meta: {
    name: '@ws-hmeqo/nuxt-infra',
  },

  hooks: {
    'prepare:types': ({ references }) => {
      references.push({
        types: '@ws-hmeqo/nuxt-infra/types',
      })
    },
  },

  moduleDependencies: {
    '@nuxt/fonts': {},
    '@nuxt/eslint': {},
    '@nuxt/test-utils': {},
    '@nuxtjs/seo': {},
    'nuxt-og-image': {
      defaults: <Partial<NuxtOgImageOptions>>{
        enabled: false,
      },
    },
    '@nuxtjs/device': {},
    '@nuxt/icon': {
      defaults: <Partial<NuxtIconOptions>>{
        mode: 'svg',
        provider: 'server',
      },
    },
    '@vueuse/nuxt': {},
    'dayjs-nuxt': {
      defaults: <Partial<DayjsOptions>>{
        locales: ['en', 'zh-cn'],
        plugins: ['relativeTime', 'utc', 'timezone', 'quarterOfYear'],
        defaultLocale: 'zh-cn',
        defaultTimezone: 'Asia/Shanghai',
      },
    },
    '@ws-hmeqo/util': {},
    '@ws-hmeqo/nuxt-web-kit': {},
    '@ws-hmeqo/nuxt-color-mode': {},
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.experimental.typedPages = true

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components'),
    })

    addPlugin(resolver.resolve('./plugins/error.ts'))

    addImportsDir([resolver.resolve('./composables'), resolver.resolve('./utils'), resolver.resolve('./stores')])
  },
})
