export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error: unknown) => {}

  nuxtApp.hook('vue:error', (error) => {
    if (error instanceof AbortError) {
      if (error.message) console.log(error.message)
      return
    }
    console.error('vue:error', error)
  })

  nuxtApp.hook('app:error', (error) => {
    console.error('app:error', error)
  })
})
