<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import type { DataTableColumns, DataTableRowData, DropdownProps } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    stateKey: string
    columns: DataTableColumns<any>
    menuOptions?: DropdownProps['options']
    loading?: boolean
    data?: DataTableRowData[]
    scrollX?: number
    rowForceActive?: boolean
    rowClass?: (row: any, index: number) => string
    extraRowProps?: (row: any, index: number) => Record<string, unknown>
    throttle?: number
  }>(),
  {
    throttle: 100
  }
)
const selected = defineModel<unknown>('selected')
const menuVisible = defineModel<boolean>('show-menu', { default: false })
const checkedRowKeys = defineModel<any[]>('checked-row-keys', { default: () => [] })
const selectedIndex = ref<number>()
const clickedAt = ref(Date.now())

const page = usePiniaState(`${props.stateKey}-page`, { default: () => 1 })
const pageSize = usePiniaCache<number | undefined>(`${props.stateKey}-page-size`)

const menuPosition = ref({ x: 0, y: 0 })
const select = (row: unknown, index?: number) => {
  selectedIndex.value = index
  selected.value = row
}
const showDropmenu = (e: MouseEvent, row: unknown, index?: number) => {
  e.preventDefault()
  if (menuVisible.value || Date.now() - clickedAt.value < props.throttle) return
  menuPosition.value.x = e.clientX
  menuPosition.value.y = e.clientY
  selectedIndex.value = index
  select(row, index)
  menuVisible.value = true
}

const clickOutside = () => {
  menuVisible.value = false
  clickedAt.value = Date.now()
}

defineExpose({ select, showDropmenu })
</script>

<template>
  <slot name="content" :show-dropmenu="showDropmenu" :select="select">
    <NDataTable
      :key="(!!data?.length).toString()"
      v-model:page="page"
      v-model:page-size="pageSize"
      v-model:checked-row-keys="checkedRowKeys"
      class="h-full"
      flex-height
      :pagination="naiveGetPagination({ page, pageSize })"
      :row-props="
        (row, index) => ({
          class: rowClass?.(row, index),
          style:
            (menuVisible || rowForceActive) && selectedIndex === index
              ? { '--n-merged-td-color': 'var(--n-merged-td-color-hover)' }
              : {},
          onContextmenu: (e) => {
            showDropmenu(e, row, index)
          },
          ...extraRowProps?.(row, index)
        })
      "
      :row-key="(row) => row.id"
      sticky-expanded-rows
      v-bind="$props"
    />
  </slot>
  <Teleport to="#teleports">
    <NDropdown
      class="border-card"
      placement="bottom-start"
      trigger="manual"
      :x="menuPosition.x"
      :y="menuPosition.y"
      :options="menuOptions"
      :show="menuVisible"
      @clickoutside="clickOutside()"
    />
  </Teleport>
</template>
