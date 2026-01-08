export type ToolbarItem =
  | {
      type: 'button'
      id?: string
      icon: string
      tooltip?: string
      badge?: string | number
      value?: unknown
      active?: boolean
      onClick?: (e: MouseEvent) => void
    }
  | { type: 'separator'; id?: string }
  | {
      type: 'color-picker'
      id: string
      options: {
        color: string
        label: string
        active?: boolean
        onClick?: (e: MouseEvent) => void
      }[]
    }
