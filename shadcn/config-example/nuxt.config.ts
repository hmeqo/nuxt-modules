import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@ws-hmeqo/nuxt-color-mode', '@ws-hmeqo/tailwindcss', '@ws-hmeqo/shadcn'],
  colorMode: {
    preference: 'dark',
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
