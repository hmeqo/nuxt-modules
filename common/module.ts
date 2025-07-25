import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import type { ModuleOptions as ColorModeModuleOptions } from '@nuxtjs/color-mode'
import { defu } from 'defu'

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

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const modules = [
      '@nuxt/fonts',
      '@nuxt/eslint',
      '@nuxt/image',
      '@nuxt/icon',
      '@nuxt/test-utils',
      '@nuxtjs/seo',
      '@vueuse/nuxt',
      '@pinia/nuxt',
      'pinia-plugin-persistedstate/nuxt',
      '@hmeqo/nuxt-web-kit',
      '@nuxtjs/color-mode'
    ]

    // @ts-expect-error unknown type
    nuxt.options.colorMode = defu(nuxt.options.colorMode, <ColorModeModuleOptions>{
      classSuffix: '',
      storage: 'cookie',
      storageKey: 'color-mode'
    })

    for (const module of modules) await installModule(module)

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
