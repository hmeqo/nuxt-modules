<script setup lang="ts">
defineProps<{
  error?: Error
  errorClass?: ClassProp
}>()
</script>

<template>
  <div class="p-2 border-red-500 border-solid border-1 rounded-1 bg-red-200" :class="errorClass">
    <div>出错了</div>
    <div>错误类型: {{ error?.name }}</div>
    <div>错误信息: {{ error?.message }}</div>
  </div>
</template>
