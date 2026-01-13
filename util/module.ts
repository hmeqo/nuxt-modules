import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/util',
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    addImportsDir(resolver.resolve('./utils'))
  },
})
