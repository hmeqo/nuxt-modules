import { addComponentsDir, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions as PwaModuleOptions } from '@vite-pwa/nuxt'

export default defineNuxtModule({
  meta: {
    name: '@workspace-hmeqo/pwa'
  },

  moduleDependencies: {
    '@vite-pwa/nuxt': {
      defaults: <Partial<PwaModuleOptions>>{
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
      }
    }
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add components
    addComponentsDir({
      path: resolver.resolve('./components')
    })
  }
})
