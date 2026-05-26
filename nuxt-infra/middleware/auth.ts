import type { AuthMeta, AuthStrategy } from '../types/auth'

function normalizeShorthand(raw: AuthStrategy): AuthMeta | null {
  if (raw === 'optional') return null
  if (raw === 'guest') return { guest: true }
  if (raw === 'authenticated') return { required: true }
  return null
}

export default defineNuxtRouteMiddleware(async (to) => {
  const raw = to.meta.auth
  if (!raw) return

  const meta = typeof raw === 'string' ? normalizeShorthand(raw) : raw
  if (!meta) return

  const adapter = useAuthAdapter()
  const isAuthed = adapter.isAuthenticated()

  const authInit = useState('auth:init', () => false)
  if (!authInit.value) {
    authInit.value = true
    adapter.init().then(() => {
      if (!adapter.isAuthenticated()) navigateTo(adapter.url.login)
    })
  }

  if (meta.redirect) {
    if (meta.redirect.authed && isAuthed) return navigateTo(meta.redirect.authed)
    if (meta.redirect.guest && !isAuthed) return navigateTo(meta.redirect.guest)
  }

  if (meta.guest && isAuthed) return navigateTo(adapter.url.home)
  if (meta.required && !isAuthed) return navigateTo(adapter.url.login)

  if (meta.permissions && isAuthed) {
    const required = Array.isArray(meta.permissions) ? meta.permissions : [meta.permissions]
    if (!adapter.checkPermission(adapter.getPermissions(), required)) {
      if (meta.forbidden) return navigateTo(meta.forbidden)
      throw createError({ statusCode: 403, fatal: true })
    }
  }
})
