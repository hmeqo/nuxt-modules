<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    initialX?: number
    initialY?: number
  }>(),
  {
    title: 'Tools'
  }
)

const {
  containerRef,
  events,
  screen: { screenSize }
} = useKonvaContext()

const panelRef = ref<HTMLElement | null>(null)
const x = ref(props.initialX ?? 10)
const y = ref(props.initialY ?? 10)
const isDragging = ref(false)

const { startDrag } = (() => {
  let startX = 0
  let startY = 0
  let initialLeft = 0
  let initialTop = 0

  const startDrag = (e: MouseEvent) => {
    isDragging.value = true
    startX = e.clientX
    startY = e.clientY
    initialLeft = x.value
    initialTop = y.value

    containerRef.value?.addEventListener('mousemove', onDrag)
    containerRef.value?.addEventListener('mouseup', stopDrag)
  }

  const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return

    const dx = e.clientX - startX
    const dy = e.clientY - startY

    updatePos(initialLeft + dx, initialTop + dy)
  }

  const updatePos = (newX: number, newY: number) => {
    if (panelRef.value) {
      const { offsetWidth: w, offsetHeight: h } = panelRef.value
      const maxW = screenSize.value.width - w - 10
      const maxH = screenSize.value.height - h - 10

      newX = Math.max(10, Math.min(newX, maxW))
      newY = Math.max(10, Math.min(newY, maxH))
    }

    x.value = newX
    y.value = newY
  }

  const stopDrag = () => {
    isDragging.value = false
    containerRef.value?.removeEventListener('mousemove', onDrag)
    containerRef.value?.removeEventListener('mouseup', stopDrag)
  }

  const onResize = () => {
    updatePos(x.value, y.value)
  }

  onMounted(() => events.on('resize', onResize))

  onUnmounted(stopDrag)
  onUnmounted(onResize)

  return {
    startDrag
  }
})()
</script>

<template>
  <div
    ref="panelRef"
    class="absolute flex flex-col overflow-hidden border border-border rounded-lg bg-card/95 text-card-foreground shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/80 select-none transition-shadow hover:shadow-2xl"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
      cursor: isDragging ? 'grabbing' : 'default',
      transform: isDragging ? 'scale(1.01)' : 'scale(1)',
      transition: isDragging ? 'none' : 'transform 0.1s, box-shadow 0.2s'
    }"
  >
    <slot name="custom" :start-drag="startDrag" :title="title">
      <div
        class="flex items-center justify-between px-3 py-2 border-b border-border bg-background cursor-grab active:cursor-grabbing min-w-64"
        @mousedown="startDrag"
      >
        <div class="flex items-center gap-2 text-sm font-medium">
          <slot name="icon" />
          <span>{{ title }}</span>
        </div>
        <div class="i-lucide:grip-horizontal text-muted-foreground/60 text-xs" />
      </div>

      <slot />
    </slot>
  </div>
</template>
