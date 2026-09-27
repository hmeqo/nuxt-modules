import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@remqo/shadcn-unocss',
  },

  moduleDependencies: {
    'shadcn-nuxt': {},
  },

  setup(options, nuxt) {
    // const resolver = createResolver(import.meta.url)
    // addComponentsDir({
    //   path: resolver.resolve('./components')
    // })
  },
})
