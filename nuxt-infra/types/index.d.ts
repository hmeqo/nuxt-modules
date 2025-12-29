import type { HTMLAttributes } from 'vue'

export {}

declare global {
  type StrBoolean = 'true' | 'false'

  type HTMLAttrClass = HTMLAttributes['class']
}

declare module 'nuxt/app' {
  interface PageMeta {
    title?: string
    tags?: string[]
    icon?: string
  }
}
