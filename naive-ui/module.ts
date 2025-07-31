import type { ModuleOptions as NaiveUiModuleOptions } from '@bg-dev/nuxt-naiveui'
import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import { defu } from 'defu'
import modern from './themes/modern'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/naive-ui'
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public = defu(nuxt.options.runtimeConfig.public, {
      naiveui: <NaiveUiModuleOptions>{
        colorModePreferenceCookieName: 'color-mode',
        // @ts-expect-error unknown type
        colorModePreference: nuxt.options.naiveui?.colorModePreference || nuxt.options.colorMode.preference,
        // @ts-expect-error unknown type
        themeConfig: nuxt.options.naiveui?.themeConfig || modern
      }
    })

    await installModule('@bg-dev/nuxt-naiveui')

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components')
    })

    addPlugin(resolver.resolve('./plugins/colorMode.ts'))

    // Add composables
    addImportsDir(resolver.resolve('./composables'))

    // Add utils
    addImportsDir(resolver.resolve('./utils'))

    // Add stores
    addImportsDir(resolver.resolve('./stores'))
  }
})
