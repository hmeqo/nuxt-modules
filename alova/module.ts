import { addImportsDir, addPlugin, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/alova'
  },

  hooks: {
    'prepare:types': ({ references }) => {
      references.push({
        types: '@workspace-hmeqo/alova/types'
      })
    }
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Pass module options to runtimeConfig object
    // @ts-expect-error unknown type
    nuxt.options.csurf = defu(nuxt.options.csurf, {
      https: false,
      cookieKey: 'csrftoken',
      headerName: 'X-Csrftoken',
      methodsToProtect: []
    })

    await installModule('nuxt-csurf')

    // Add utils
    addImportsDir(resolver.resolve('./utils'))

    addPlugin(resolver.resolve('./plugins/alova.ts'))
  }
})
