import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@workspace-hmeqo/nuxt-web-kit',
    configKey: 'hmeqoNuxtWebKit'
  },

  defaults: {
    routeAuth: {
      defaultRedirect: false
    }
  },

  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public = defu(nuxt.options.runtimeConfig.public, {
      hmeqoNuxtWebKit: options
    })

    addImportsDir(resolve('./composables'))
    addImportsDir(resolve('./utils'))
  }
})
