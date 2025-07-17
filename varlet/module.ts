import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/varlet'
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    await installModule('@varlet/nuxt')

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components')
    })

    addPlugin(resolver.resolve('./plugins/color-mode.ts'))

    // Add utils
    // addImportsDir(resolver.resolve('./utils'))
  }
})
