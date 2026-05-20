import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@ws-hmeqo/shadcn-unocss',
  },

  moduleDependencies: {
    'shadcn-nuxt': {},
  },

  setup(options, nuxt) {
    // const resolver = createResolver(import.meta.url)
    // Add components
    // addComponentsDir({
    //   path: resolver.resolve('./components')
    // })
  },
})
