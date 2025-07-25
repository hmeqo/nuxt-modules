<script setup lang="ts">
withDefaults(
  defineProps<{
    contentClass?: ClassProp
    showIcon?: boolean
    iconName?: string
    iconSize?: number
    truncate?: boolean
  }>(),
  {
    showIcon: false,
    iconName: 'information-outline',
    iconSize: 16,
    truncate: true
  }
)

const show = ref(false)
</script>

<template>
  <div class="inline-flex items-center gap-1 min-w-0" @click.stop="show = true">
    <VarIcon v-if="showIcon" class="text-gray-500" :name="iconName" :size="iconSize" />
    <div :class="[{ truncate }, contentClass]"><slot /></div>
    <VarPopup v-model:show="show">
      <div class="p-6">
        <slot />
      </div>
    </VarPopup>
  </div>
</template>
