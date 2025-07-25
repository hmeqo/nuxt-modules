import { NIcon, NPopover, NuxtLink } from '#components'
import type { PopoverProps, SelectOption } from 'naive-ui'
import type { VNodeProps } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export function naiveRenderAction(text: string, onclick: () => void) {
  return () => h('a', { onclick }, text)
}

export function renderIcon(data: {
  type?: unknown
  content?: string | VNode
  attr?: VNodeProps & Record<string, unknown>
}) {
  return () =>
    h(data.type || NIcon, data.attr, {
      default: () => data.content
    })
}

export function naiveRenderLink(text: string, url: RouteLocationRaw, attr?: VNodeProps & Record<string, unknown>) {
  return () =>
    h(
      NuxtLink,
      {
        ...attr,
        to: url,
        onClick: (e: Event) => {
          ;(e.target as HTMLAnchorElement)?.blur()
        },
        draggable: false
      },
      () => text
    )
}

export const naiveRenderPopover =
  (opts?: { node?: (option: SelectOption) => VNode; popoverProps?: PopoverProps }) =>
  ({ node, option }: { node: VNode; option: SelectOption }) =>
    h(
      NPopover,
      {
        style: {
          pointerEvents: 'none',
          transition: 'none',
          paddingLeft: '12px',
          paddingRight: '12px',
          backgroundColor: '#252525'
        },
        placement: 'left',
        overlap: true,
        ...opts?.popoverProps
      },
      {
        trigger: () => node,
        default: () => opts?.node?.(option) ?? `${option.label}`
      }
    )
