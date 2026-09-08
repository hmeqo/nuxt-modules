import { createError, defineNuxtRouteMiddleware, navigateTo, onNuxtReady, useState } from 'nuxt/app'
import { useAuthAdapter } from '../composables/authAdapter'
import type { AuthMeta, AuthStrategy } from '../types/auth'

function normalizeShorthand(raw: AuthStrategy): AuthMeta | null {
  if (raw === 'public') return null
  if (raw === 'anonymous') return { anonymous: true }
  if (raw === 'authenticated') return { authenticated: true }
  return null
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.prerender) return

  const raw = to.meta.auth as AuthStrategy | AuthMeta | undefined
  if (!raw) return

  const meta = typeof raw === 'string' ? normalizeShorthand(raw) : raw
  if (!meta) return

  const adapter = useAuthAdapter()
  const isAuthed = adapter.isAuthenticated()

  const authInit = useState('authInit', () => false)
  if (import.meta.client && !authInit.value) {
    authInit.value = true
    onNuxtReady(() => {
      adapter.init().then(() => {
        if (!adapter.isAuthenticated()) navigateTo(adapter.url.login)
      })
    })
  }

  if (meta.redirect) {
    if (meta.redirect.authed && isAuthed) return navigateTo(meta.redirect.authed)
    if (meta.redirect.anonymous && !isAuthed) return navigateTo(meta.redirect.anonymous)
  }

  if (meta.anonymous && isAuthed) return navigateTo(adapter.url.home)
  if (meta.authenticated && !isAuthed) return navigateTo(adapter.url.login)

  if (meta.permissions && isAuthed) {
    const required = Array.isArray(meta.permissions) ? meta.permissions : [meta.permissions]
    if (!adapter.checkPermission(adapter.getPermissions() ?? [], required)) {
      if (meta.forbidden) return navigateTo(meta.forbidden)
      throw createError({ statusCode: 403, fatal: true })
    }
  }
})
