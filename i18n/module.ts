import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions as I18nOptions } from '@nuxtjs/i18n'
import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/i18n',
  },

  moduleDependencies: {
    '@nuxtjs/i18n': {
      defaults: <Partial<I18nOptions>>{
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
    nuxt.options.runtimeConfig.public = defu(
      {
        i18n: {
          cookieKey: options.detectBrowserLanguage?.cookieKey || 'language',
        },
      },
      nuxt.options.runtimeConfig.public,
    )

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components'),
    })

    // Add composables
    addImportsDir(resolver.resolve('./composables'))

    addPlugin(resolver.resolve('./plugins/i18n.ts'))
  },
})
