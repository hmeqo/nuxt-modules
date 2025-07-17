import { addComponentsDir, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@workspace-hmeqo/watermark',
    configKey: 'watermark'
  },

  defaults: {
    columns: 3,
    count: 18
  },

  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Pass module options to runtimeConfig object
    // @ts-expect-error unknown type
    nuxt.options.runtimeConfig.public = defu(nuxt.options.runtimeConfig.public, {
      watermark: options
    })

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components')
    })
  }
})
