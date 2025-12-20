export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (_err: unknown) => {}

  nuxtApp.hook('vue:error', (err) => {
    if (err instanceof AbortError) {
      if (err.message) console.log(err.message)
      return
    }
    console.error('vue:error', err)
  })

  nuxtApp.hook('app:error', (err) => {
    console.error('app:error', err)
  })
})
