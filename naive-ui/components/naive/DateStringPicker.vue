<script setup lang="ts">
import { dateString, timeString } from '@workspace-hmeqo/util/lib/date'

const props = defineProps<{
  type?: 'datetime' | 'date'
}>()

const model = defineModel<string | null>('modelValue')
</script>

<template>
  <NDatePicker
    :value="model ? new Date(model).valueOf() : null"
    :type="type"
    @update:value="
      (v) =>
        (model = v
          ? type === 'datetime'
            ? new Date(v).toISOString()
            : type === 'date'
              ? dateString(new Date(v))
              : timeString(new Date(v))
          : null)
    "
  />
</template>
