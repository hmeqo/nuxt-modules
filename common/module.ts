import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions as ColorModeModuleOptions } from '@nuxtjs/color-mode'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/common'
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
    '@nuxt/image': {},
    '@nuxt/icon': {},
    '@nuxt/test-utils': {},
    '@nuxtjs/seo': {},
    '@vueuse/nuxt': {},
    '@pinia/nuxt': {},
    'pinia-plugin-persistedstate/nuxt': {},
    '@hmeqo/nuxt-web-kit': {},
    '@nuxtjs/color-mode': {
      defaults: <Partial<ColorModeModuleOptions>>{
        classSuffix: '',
        storage: 'cookie',
        storageKey: 'color-mode'
      }
    }
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components')
    })

    addPlugin(resolver.resolve('./plugins/error.ts'))
    addPlugin(resolver.resolve('./plugins/dayjs.ts'))

    // Add composables
    addImportsDir(resolver.resolve('./composables'))

    // Add stores
    addImportsDir(resolver.resolve('./stores'))

    // Add utils
    addImportsDir(resolver.resolve('./utils'))
  }
})
