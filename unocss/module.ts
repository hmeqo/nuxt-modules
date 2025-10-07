import { createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/unocss'
  },

  moduleDependencies: {
    '@unocss/nuxt': {}
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
  }
})
