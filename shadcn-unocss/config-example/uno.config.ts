import shadcnUnocssConfig from '@workspace-hmeqo/shadcn-unocss/config'
import { defineConfig, mergeConfigs } from 'unocss'

export default defineConfig(
  mergeConfigs([
    shadcnUnocssConfig,
    {
      // Add your own config
    }
  ])
)
