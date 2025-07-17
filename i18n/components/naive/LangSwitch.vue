<script setup lang="ts">
const { availableLocales } = useI18n()
const locale = useLocale()

watch(locale, (v) => {
  useLangCookie().value = v
})
</script>

<template>
  <div>
    <NSelect v-model:value="locale" :options="availableLocales.map((x) => ({ label: $t(x), value: x }))" />
  </div>
</template>
