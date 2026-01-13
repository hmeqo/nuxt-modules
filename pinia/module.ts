import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/pinia',
  },

  moduleDependencies: {
    '@pinia/nuxt': {},
    'pinia-plugin-persistedstate/nuxt': {},
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add composables
    addImportsDir(resolver.resolve('./composables'))

    // Add stores
    addImportsDir(resolver.resolve('./stores'))
  },
})
