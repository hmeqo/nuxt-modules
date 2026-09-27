import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@remqo/page-history',
  },

  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    addPlugin({
      src: resolver.resolve('./plugins/history.ts'),
    })

    addComponentsDir({
      path: resolver.resolve('./components'),
    })

    addImportsDir(resolver.resolve('./composables'))
  },
})
