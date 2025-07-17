<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    loadingClass?: ClassProp
    throttle?: number
  }>(),
  {
    throttle: 300
  }
)

const show = ref(false)
setTimeout(() => (show.value = true), props.throttle)
</script>

<template>
  <div v-if="show" :class="loadingClass">
    <slot>
      <NFlex class="px-6 py-5" vertical>
        <NSkeleton height="40px" />
        <NSkeleton height="40px" />
        <NSkeleton height="400px" />
        <NSkeleton height="200px" />
        <NSkeleton height="40px" />
        <NSkeleton height="80px" />
      </NFlex>
    </slot>
  </div>
</template>
