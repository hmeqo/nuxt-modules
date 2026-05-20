import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@ws-hmeqo/alova',
  },
  moduleDependencies: {
    '@ws-hmeqo/util': {},
  },

  hooks: {
    'prepare:types': ({ references }) => {
      references.push({
        types: '@ws-hmeqo/alova/types',
      })
    },
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add utils
    addImportsDir(resolver.resolve('./utils'))
  },
})
