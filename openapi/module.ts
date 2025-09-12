import { addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/openapi'
  },

  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add imports
    addImports({
      from: '@hmeqo/openapi-utils',
      name: 'schemaToDefaults'
    })

    addPlugin(resolver.resolve('./plugins/sdk'))
  }
})
