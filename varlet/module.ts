import { addComponentsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/varlet',
  },

  moduleDependencies: {
    '@varlet/nuxt': {},
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components'),
    })

    addPlugin(resolver.resolve('./plugins/color-mode.ts'))

    // Add utils
    // addImportsDir(resolver.resolve('./utils'))
  },
})
