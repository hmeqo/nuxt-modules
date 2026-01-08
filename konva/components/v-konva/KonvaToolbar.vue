<script setup lang="ts">
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
          <div class="i-lucide-grip-vertical size-4" />
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
              :class="{ 'ring-2 ring-primary ring-offset-1 ring-offset-background': color.active }"
              :style="{ backgroundColor: color }"
              :title="color.label"
              @click="color.onClick"
            />
          </div>

          <!-- 类型 C: 普通按钮 / 切换按钮 -->
          <UiButton
            v-else
            class="p-0 aspect-square"
            :title="item.tooltip"
            :variant="item.active ? 'default' : 'ghost'"
            size="xs"
            @click="item.onClick"
          >
            <!-- 图标 -->
            <div :class="[item.icon, 'text-sm']" />

            <!-- 角标 (可选) -->
            <span
              v-if="item.badge"
              class="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground ring-1 ring-background"
            >
              {{ item.badge }}
            </span>
          </UiButton>
        </template>

        <slot />
      </div>
    </template>
  </VKonvaFloatingPanel>
</template>
