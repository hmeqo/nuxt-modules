import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/alova',
  },
  moduleDependencies: {
    '@workspace-hmeqo/util': {},
  },

  hooks: {
    'prepare:types': ({ references }) => {
      references.push({
        types: '@workspace-hmeqo/alova/types',
      })
    },
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add utils
    addImportsDir(resolver.resolve('./utils'))
  },
})
