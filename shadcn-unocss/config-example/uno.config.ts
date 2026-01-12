import shadcnUnocssConfig from '@workspace-hmeqo/shadcn-unocss/config'
import {
  defineConfig,
  mergeConfigs,
  presetIcons,
  transformerCompileClass,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig(
  mergeConfigs([
    shadcnUnocssConfig(),
    // Your own config
    {
      presets: [presetIcons()],
      transformers: [transformerVariantGroup(), transformerDirectives(), transformerCompileClass()],
      theme: {
        fontFamily: {
          mono: [
            'Maple Mono',
            'ui-monospace',
            'SFMono-Regular',
            'Menlo',
            'Monaco',
            'Consolas',
            'Liberation Mono',
            'Courier New',
            'monospace',
          ],
        },
      },
      shortcuts: {
        'px-container': 'px-6',
        'py-container': 'py-12',
      },
    },
  ]),
)
