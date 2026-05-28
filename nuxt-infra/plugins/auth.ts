export default defineNuxtPlugin(() => {
  const adapter = useAuthAdapter()
  const authInit = useState('authInit', () => false)
  if (!authInit.value) {
    authInit.value = true
    adapter.init().then(() => {
      if (!adapter.isAuthenticated()) navigateTo(adapter.url.login)
    })
  }
})
