import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@remqo/alova',
  },
  moduleDependencies: {
    '@remqo/util': {},
  },

  hooks: {
    'prepare:types': ({ references }) => {
      references.push({
        types: '@remqo/alova/types',
      })
    },
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add utils
    addImportsDir(resolver.resolve('./utils'))
  },
})
