import { addImports, addImportsDir, addPlugin, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/backend'
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Pass module options to runtimeConfig object
    nuxt.options.csurf = defu(nuxt.options.csurf, {
      https: false,
      cookieKey: 'csrftoken',
      headerName: 'X-Csrftoken',
      methodsToProtect: []
    })

    await installModule('nuxt-csurf')

    // Add composables
    addImportsDir(resolver.resolve('./composables'))

    // Add utils
    addImportsDir(resolver.resolve('./utils'))

    addPlugin(resolver.resolve('./plugins/alova.ts'))

    addImports({
      name: 'Branch',
      from: '@hmeqo/easymodel',
      type: true
    })

    addImportsDir([resolver.resolve('./lib/auto-imports')])
  }
})
