<script setup lang="ts">
import { useNaiveConfig } from '../../lib/naive-config'

const { locale, dateLocale } = useNaiveConfig()
</script>

<template>
  <NaiveConfig :locale="locale" :date-locale="dateLocale">
    <slot />
  </NaiveConfig>
</template>
