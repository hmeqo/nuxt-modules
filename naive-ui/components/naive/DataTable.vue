<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import type { DataTableColumns, DataTableRowData, DropdownProps } from 'naive-ui'

const props = defineProps<{
  stateKey: string
  columns: DataTableColumns<any>
  menuOptions?: DropdownProps['options']
  loading?: boolean
  data?: DataTableRowData[]
  scrollX?: number
  rowForceActive?: boolean
  rowClass?: (row: any, index: number) => string
  extraRowProps?: (row: any, index: number) => Record<string, unknown>
}>()
const selected = defineModel<unknown>('selected')
const menuVisible = defineModel<boolean>('show-menu', { default: false })
const checkedRowKeys = defineModel<any[]>('checked-row-keys', { default: () => [] })
const selectedIndex = ref<number>()

const page = usePiniaState(`${props.stateKey}-page`, { default: () => 1 })
const pageSize = usePiniaCache<number | undefined>(`${props.stateKey}-page-size`)

const menuPosition = ref({ x: 0, y: 0 })
const showDropmenu = (row: unknown, index: number) => {
  selectedIndex.value = index
  selected.value = row
  menuVisible.value = true
}
</script>

<template>
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
          e.preventDefault()
          if (menuVisible) return
          menuPosition.x = e.clientX
          menuPosition.y = e.clientY
          showDropmenu(row, index)
        },
        ...extraRowProps?.(row, index)
      })
    "
    :row-key="(row) => row.id"
    sticky-expanded-rows
    v-bind="$props"
  />
  <Teleport to="#teleports">
    <NDropdown
      class="border-card"
      placement="bottom-start"
      trigger="manual"
      :x="menuPosition.x"
      :y="menuPosition.y"
      :options="menuOptions"
      :show="menuVisible"
      @clickoutside="menuVisible = false"
    />
  </Teleport>
</template>
