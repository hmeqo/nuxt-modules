import { createResolver, defineNuxtModule, installModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/unocss'
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    await installModule('@unocss/nuxt')
  }
})
