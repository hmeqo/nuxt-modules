import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions as I18nOptions } from '@nuxtjs/i18n'

export default defineNuxtModule({
  meta: {
    name: '@ws-hmeqo/i18n',
  },

  moduleDependencies: {
    '@nuxtjs/i18n': {
      defaults: <Partial<Omit<I18nOptions, 'locales'>>>{
        strategy: 'no_prefix',
        detectBrowserLanguage: false,
        experimental: {
          typedOptionsAndMessages: 'default',
        },
        bundle: {
          optimizeTranslationDirective: false,
        },
      },
    },
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Pass module options to runtimeConfig object
    nuxt.options.runtimeConfig.public.i18n = {
      ...nuxt.options.runtimeConfig.public.i18n,
      cookieKey: options.detectBrowserLanguage?.cookieKey || 'language',
    }

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components'),
    })

    // Add composables
    addImportsDir(resolver.resolve('./composables'))

    addPlugin(resolver.resolve('./plugins/i18n.ts'))
  },
})
