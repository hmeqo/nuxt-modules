import { addComponentsDir, addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@ws-hmeqo/konva',
  },

  hooks: {
    'prepare:types': ({ references }) => {
      references.push({
        types: '@ws-hmeqo/konva/types',
      })
    },
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    addComponentsDir({
      path: resolver.resolve('./components'),
    })
    addImportsDir(resolver.resolve('./composables'))
    addImportsDir(resolver.resolve('./utils'))
  },
})
