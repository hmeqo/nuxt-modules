<script setup lang="ts">
import z from 'zod'

const props = defineProps<{
  min?: number
  max?: number
}>()

const _model = defineModel<number>('modelValue')
const model = computed({
  get: () => _model.value?.toString(),
  set: (v) => (_model.value = Number(v)),
})

const rules = computed(() => {
  const rules = []
  if (props.min) rules.push(z.string().min(props.min, `文本长度必须大于${props.min}`))
  if (props.max) rules.push(z.string().max(props.max, `文本长度必须小于${props.max}`))
  return rules
})
</script>

<template>
  <VarInput v-model="model" type="number" size="small" :rules="rules">
    <template #append-icon>
      <slot name="append-icon" />
    </template>
    <slot />
  </VarInput>
</template>
