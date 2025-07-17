import { usePageHistory } from '../composables/history'

export default defineNuxtPlugin((nuxtApp) => {
  const { enabled, addPath, clearPaths } = usePageHistory()
  useRouter().afterEach((to) => {
    if (!enabled.value || to.path !== location?.pathname) return
    addPath(to)
  })

  watch(enabled, (v) => {
    if (v) addPath(useRoute())
    else clearPaths()
  })
})
