import type { ModuleOptions as NaiveUiModuleOptions } from '@bg-dev/nuxt-naiveui'
import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import modern from './themes/modern'

export default defineNuxtModule({
  meta: {
    name: '@remqo/naive-ui',
  },

  moduleDependencies: (nuxt) => ({
    '@bg-dev/nuxt-naiveui': {
      defaults: <Partial<NaiveUiModuleOptions>>{
        colorModePreferenceCookieName: 'color-mode',
        // @ts-expect-error
        colorModePreference: nuxt.options.naiveui?.colorModePreference || nuxt.options.colorMode.preference,
        // @ts-expect-error
        themeConfig: defu(nuxt.options.naiveui?.themeConfig || modern, { shared: { common: { fontFamily: '' } } }),
      },
    },
  }),

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    addComponentsDir({
      path: resolver.resolve('./components'),
    })

    addPlugin(resolver.resolve('./plugins/colorMode.ts'))

    addImportsDir(resolver.resolve('./composables'))

    addImportsDir(resolver.resolve('./utils'))

    addImportsDir(resolver.resolve('./stores'))
  },
})
