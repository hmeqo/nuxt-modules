<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    scrollable?: boolean
    loading?: boolean
    error?: Error
    contentClass?: HTMLAttrClass
    loadingClass?: HTMLAttrClass
    errorClass?: HTMLAttrClass
    padding?: string
  }>(),
  {
    padding: 'px-6 py-5'
  }
)
</script>

<template>
  <div class="flex w-full h-full">
    <Transition name="loading" mode="out-in">
      <ComCtlLoading v-if="loading" class="com" v-bind="props">
        <slot name="loading" />
      </ComCtlLoading>
      <ComCtlError v-else-if="error" class="com" v-bind="props" />
      <ComCtlDefault v-else v-bind="props">
        <slot />
      </ComCtlDefault>
    </Transition>
  </div>
</template>

<style scoped>
.com {
  --uno: 'shrink-0 w-full h-full';
}
</style>
