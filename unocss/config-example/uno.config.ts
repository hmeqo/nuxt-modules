import {
  presetIcons,
  presetWind4,
  defineConfig,
  transformerCompileClass,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  rules: [],
  presets: [presetWind4(), presetIcons()],
  transformers: [transformerVariantGroup(), transformerDirectives(), transformerCompileClass()],
  theme: {
    font: {
      mono: ['"Maple Mono"', 'monospace'],
    },
    colors: {
      'card-border-light': '#f0f0f0',
      'card-border-dark': '#2f2f2f',
    },
  },
  shortcuts: [
    ['border-card', 'border border-solid border-card-border-light dark:border-card-border-dark'],
    ['border-border', 'border-card-border-light dark:border-card-border-dark'],
    ['text-soft', 'text-xs text-gray-500 dark:text-neutral-400'],
  ],
})
