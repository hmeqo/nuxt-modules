import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/backend'
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add composables
    addImportsDir(resolver.resolve('./composables'))
  }
})
