import { addComponentsDir, addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions as I18nOptions } from '@nuxtjs/i18n'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/i18n'
  },

  moduleDependencies: {
    '@nuxtjs/i18n': {
      defaults: <Partial<I18nOptions>>{
        strategy: 'no_prefix',
        detectBrowserLanguage: {
          useCookie: true,
          cookieKey: 'language',
          redirectOn: 'no prefix'
        },
        bundle: {
          optimizeTranslationDirective: false
        }
      }
    }
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components')
    })

    // Add composables
    addImportsDir(resolver.resolve('./composables'))
  }
})
