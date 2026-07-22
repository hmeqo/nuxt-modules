<script setup lang="ts">
import { GripVertical } from '@lucide/vue'
import type { ToolbarItem } from '../../types'

const props = defineProps<{
  items?: ToolbarItem[]
  initialX?: number
  initialY?: number
}>()
</script>

<template>
  <VKonvaFloatingPanel :initial-x="initialX" :initial-y="initialY">
    <template #custom="{ startDrag }">
      <div class="flex items-center gap-1 p-0.5 px-1">
        <div
          class="flex items-center justify-center h-full cursor-grab active:cursor-grabbing text-muted-foreground active:text-foreground transition-colors"
          @mousedown="startDrag"
        >
          <GripVertical class="size-4" />
        </div>
        <!-- 2. 动态渲染工具项 -->
        <template v-for="(item, index) in items" :key="item.id || index">
          <!-- 类型 A: 分割线 -->
          <div v-if="item.type === 'separator'" class="w-[1px] h-5 bg-border/60" />

          <!-- 类型 B: 颜色选择器 -->
          <div v-else-if="item.type === 'color-picker'" class="flex items-center gap-1.5 px-1">
            <UiButton
              v-for="color in item.options"
              :key="color.color"
              class="!size-5 !min-w-0 !rounded-full !p-0"
              :style="{ backgroundColor: color.color }"
              @click="color.action"
            />
          </div>
        </template>
      </div>
    </template>
  </VKonvaFloatingPanel>
</template>
