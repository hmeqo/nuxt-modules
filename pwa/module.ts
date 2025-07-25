import { addComponentsDir, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import type { ModuleOptions as PwaModuleOptions } from '@vite-pwa/nuxt'
import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/pwa'
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.pwa = defu(nuxt.options.pwa, <PwaModuleOptions>{
      registerType: 'autoUpdate',
      manifest: {
        name: 'App',
        short_name: 'App',
        theme_color: '#141414',
        description: 'App',
        icons: [
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        display: 'standalone'
      },
      registerWebManifestInRouteRules: true,
      devOptions: {
        enabled: false,
        type: 'module'
      }
    })

    await installModule('@vite-pwa/nuxt')

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components')
    })
  }
})
