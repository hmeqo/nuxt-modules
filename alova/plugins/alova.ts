import { alovaInst } from '../lib/core'

export default defineNuxtPlugin(() => {
  if (useRuntimeConfig().public.cors) {
    alovaInst.options.baseURL = useRuntimeConfig().public.apiBase
  }
})
