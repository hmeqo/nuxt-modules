import { addComponentsDir, addImportsDir, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import type { ModuleOptions } from '@nuxtjs/i18n'
import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/i18n'
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.i18n = defu(nuxt.options.i18n, <ModuleOptions>{
      strategy: 'no_prefix',
      detectBrowserLanguage: {
        useCookie: false
      },
      bundle: {
        optimizeTranslationDirective: false
      },
      lazy: true
    })

    await installModule('@nuxtjs/i18n')

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components')
    })

    // Add composables
    addImportsDir(resolver.resolve('./composables'))

    // Add composables
    addImportsDir(resolver.resolve('./utils'))
  }
})
