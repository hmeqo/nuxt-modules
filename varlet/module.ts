import { addComponentsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@remqo/varlet',
  },

  moduleDependencies: {
    '@varlet/nuxt': {},
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    addComponentsDir({
      path: resolver.resolve('./components'),
    })

    addPlugin(resolver.resolve('./plugins/color-mode.ts'))

    // addImportsDir(resolver.resolve('./utils'))
  },
})
