import type { PaginationProps } from 'naive-ui'

export function naiveGetPagination(opt?: { page?: number; pageSize?: number; itemCount?: number }): PaginationProps {
  const { isMobile } = useNaiveDevice()
  return reactive({
    page: opt?.page ?? undefined,
    showSizePicker: true,
    defaultPageSize: opt?.pageSize ?? 100,
    pageSizes: [10, 20, 50, 100, 200],
    itemCount: opt?.itemCount,
    prefix: ({ itemCount }) => h('div', { style: { 'flex-shrink': '0' } }, `总数 ${itemCount}`),
    simple: isMobile,
  })
}
