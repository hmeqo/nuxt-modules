<script setup lang="ts">
import type { DataTableColumns, DataTableRowData, DropdownProps } from 'naive-ui'

const props = defineProps<{
  stateKey: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: DataTableColumns<any>
  menuOptions?: DropdownProps['options']
  loading?: boolean
  data?: DataTableRowData[]
  scrollX?: number
  rowForceActive?: boolean
}>()
const chosen = defineModel<unknown>('selected')
const menuVisible = defineModel<boolean>('show-menu', { default: false })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkedRowKeys = defineModel<any[]>('checked-row-keys', { default: () => [] })
const selectedIndex = ref(0)

const page = usePiniaState(`${props.stateKey}-page`, { default: () => 1 })
const pageSize = usePiniaCache<number | undefined>(`${props.stateKey}-page-size`)

const menuPosition = ref({ x: 0, y: 0 })
const showDropmenu = (row: unknown, index: number) => {
  chosen.value = row
  selectedIndex.value = index
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
        class: 'cursor-pointer',
        style: (menuVisible || rowForceActive) && selectedIndex === index ? { '--n-merged-td-color': 'var(--n-merged-td-color-hover)' } : {},
        onContextmenu: (e) => {
          e.preventDefault()
          if (menuVisible) return
          menuPosition.x = e.clientX
          menuPosition.y = e.clientY
          showDropmenu(row, index)
        }
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
