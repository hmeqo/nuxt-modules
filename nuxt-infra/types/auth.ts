import type { RouteLocationAsString } from 'vue-router'

export interface AuthAdapter {
  url: {
    login: RouteLocationAsString
    home: RouteLocationAsString
  }
  /** 校验并落地会话状态 */
  init(): Promise<void>
  isAuthenticated(): boolean
  getPermissions(): string[] | undefined
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
