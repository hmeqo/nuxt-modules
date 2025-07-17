import { cloneDeep, isEqual } from 'lodash'

export function useDiff<T extends { id: unknown }>(_data: T[]) {
  const data = ref<T[]>(_data)
  const oldData = ref<T[]>(cloneDeep(_data))
  const newDataIds = computed(() => data.value.map((v) => v.id))
  const oldDataIds = computed(() => oldData.value.map((v) => v.id))

  const added = computed(() => data.value.filter((v) => !oldDataIds.value.includes(v.id)))
  const removed = computed(() => oldData.value.filter((v) => !newDataIds.value.includes(v.id)))
  const changed = computed(() =>
    data.value.filter((v) => {
      const od = oldData.value.find((ov) => ov.id === v.id)
      return od && !isEqual(od, v)
    })
  )
  return {
    data,
    oldData,
    added,
    removed,
    changed
  }
}
