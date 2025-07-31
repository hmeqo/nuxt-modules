<script setup lang="ts">
import dayjs from 'dayjs'

const model = defineModel<string | null>('modelValue')
</script>

<template>
  <NDatePicker
    :value="model ? dayjs(model).valueOf() : null"
    @update:value="(v) => (model = v ? dayjs(v).toISOString() : null)"
  />
</template>
