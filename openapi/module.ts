import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions } from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@workspace-hmeqo/openapi'
  },

  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add imports
    addImportsDir(resolver.resolve('./utils'))
  }
})
