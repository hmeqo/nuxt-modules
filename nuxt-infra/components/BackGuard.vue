<script setup lang="ts">
declare module 'vue-router' {
  interface RouteMeta {
    backGuardInstIds: number[]
  }
}

const route = useRoute()
const router = useRouter()

const opened = defineModel<boolean>('opened', { default: false })

const count = useState('back-guard-count', () => 0)
const popstateCalls = useState('back-guard-popstate-calls', () => 0)
const lastId = useState('back-guard-last-id', () => 0)
let instId = 0
let unregisterNavigationGuard: () => void

const open = () => {
  instId = lastId.value += 1
  route.meta.backGuardInstIds = [...(route.meta.backGuardInstIds || []), instId]

  window.addEventListener('popstate', onPopstate)

  unregisterNavigationGuard = router.beforeEach((to, from, next) => next(false))
}

const close = () => {
  route.meta.backGuardInstIds = route.meta.backGuardInstIds.filter((x) => x !== instId)

  window.removeEventListener('popstate', onPopstate)

  unregisterNavigationGuard()
}

const onPopstate = () => {
  // 确保本轮事件中只会触发一次关闭, 提前计算 guard 个数
  if (!count.value) count.value = route.meta.backGuardInstIds.length

  if ((popstateCalls.value += 1) === count.value && route.meta.backGuardInstIds.at(-1) === instId) opened.value = false

  // popstate 会触发两次, 第二次触发可能是因为 `next(false)`, 确保只在最后一个事件中重置
  if (popstateCalls.value >= count.value * 2 - 1) {
    count.value = 0
    popstateCalls.value = 0
  }
}

defineExpose({ open, close })

watch(
  opened,
  (v) => {
    if (v) open()
    else close()
  },
  { immediate: true }
)
</script>

<template>
  <slot />
</template>
