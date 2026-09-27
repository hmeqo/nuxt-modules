import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@remqo/pinia',
  },

  moduleDependencies: {
    '@pinia/nuxt': {},
    'pinia-plugin-persistedstate/nuxt': {},
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    addImportsDir(resolver.resolve('./composables'))

    addImportsDir(resolver.resolve('./stores'))
  },
})
