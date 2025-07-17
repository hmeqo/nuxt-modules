<script setup lang="ts">
import { useNaiveConfig } from '../../lib/naive-config'

// const props = defineProps<{
//   light?: boolean
//   dark?: boolean
// }>()

const { locale, dateLocale } = useNaiveConfig()
</script>

<template>
  <NaiveConfig :locale="locale" :date-locale="dateLocale">
    <slot />
  </NaiveConfig>
</template>
