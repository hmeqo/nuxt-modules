import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions as ColorModeModuleOptions } from '@nuxtjs/color-mode'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/nuxt-color-mode'
  },

  moduleDependencies: {
    '@nuxtjs/color-mode': {
      defaults: <Partial<ColorModeModuleOptions>>{
        classSuffix: '',
        // storage: 'cookie',
        storageKey: 'color-mode'
      }
    }
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add composables
    addImportsDir(resolver.resolve('./composables'))
  }
})
