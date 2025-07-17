import { addComponentsDir, addImportsDir, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from '@nuxtjs/i18n'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/i18n'
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.i18n = defu(
      <ModuleOptions>{
        strategy: 'no_prefix',
        detectBrowserLanguage: {
          useCookie: false
        },
        bundle: {
          optimizeTranslationDirective: false
        },
        lazy: true
      },
      nuxt.options.i18n
    )

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
