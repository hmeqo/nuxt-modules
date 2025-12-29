import { presetWind4 } from '@unocss/preset-wind4'
import type { UserConfig } from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetShadcnV3 } from 'unocss-preset-shadcn/v3'

const config = (): UserConfig => ({
  presets: [
    presetWind4(),
    presetAnimations(),
    presetShadcnV3(
      {
        color: 'neutral',
        // With default setting for SolidUI, you need to set the darkSelector option.
        darkSelector: '[class="dark"]'
      },
      {
        // If you are using reka ui.
        componentLibrary: 'reka'
      }
    )
  ],
  // By default, `.ts` and `.js` files are NOT extracted.
  // If you want to extract them, use the following configuration.
  // It's necessary to add the following configuration if you use shadcn-vue or shadcn-svelte.
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        '(components/ui|app/components/ui)/**/*.{js,ts}'
      ]
    }
  },
  theme: {
    spacing: {
      4: '1rem'
    }
  }
})

export default config
