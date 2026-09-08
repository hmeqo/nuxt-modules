import type { RouteLocationAsString } from 'vue-router'

export interface AuthAdapter {
  url: {
    login: RouteLocationAsString
    home: RouteLocationAsString
  }
  init(): Promise<void>
  isAuthenticated(): boolean
  getPermissions(): string[]
  checkPermission(permissions: string[], required: string | string[]): boolean
}

export type AuthStrategy = 'authenticated' | 'anonymous' | 'public'

export interface AuthMeta {
  authenticated?: boolean
  anonymous?: boolean
  permissions?: string | string[]
  forbidden?: RouteLocationAsString
  redirect?: {
    authed?: RouteLocationAsString
    anonymous?: RouteLocationAsString
  }
}
