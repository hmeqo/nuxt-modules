import { createResolver, defineNuxtModule } from '@nuxt/kit'
import tailwindcss from '@tailwindcss/vite'
import defu from 'defu'

export default defineNuxtModule({
  meta: {
    name: '@ws-hmeqo/tailwindcss',
  },

  moduleDependencies: {},

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.vite = defu(nuxt.options.vite, {
      plugins: [tailwindcss()],
    })
  },
})
