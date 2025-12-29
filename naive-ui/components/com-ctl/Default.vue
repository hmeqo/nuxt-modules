<script setup lang="ts">
defineProps<{
  scrollable?: boolean
  padding?: string
  contentClass?: HTMLAttrClass
}>()
</script>

<template>
  <div class="flex w-full h-full">
    <NScrollbar v-if="scrollable" class="!overflow-clip">
      <div :class="`w-full ${padding} ${contentClass}`">
        <slot />
      </div>
    </NScrollbar>
    <div v-else :class="`w-full h-full overflow-hidden ${padding} ${contentClass}`">
      <slot />
    </div>
  </div>
</template>
