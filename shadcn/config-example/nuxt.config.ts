import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@remqo/nuxt-color-mode', '@remqo/tailwindcss', '@remqo/shadcn'],
  colorMode: {
    preference: 'dark',
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
