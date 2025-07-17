import { alovaInst } from '../lib/alova'

export default defineNuxtPlugin(() => {
  if (useRuntimeConfig().public.cors) {
    alovaInst.options.baseURL = useRuntimeConfig().public.apiBase
  }
})
