import { createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/shadcn-unocss'
  },

  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add components
    // addComponentsDir({
    //   path: resolver.resolve('./components')
    // })
  }
})
