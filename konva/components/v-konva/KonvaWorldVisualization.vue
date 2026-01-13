<script setup lang="ts">
const props = defineProps<{
  borderColor?: string
}>()

const borderColor = computed(() => ((props.borderColor ?? useColorModeApi().darkMode.value) ? '#333' : '#ddd'))
const fill = computed(() => (useColorModeApi().darkMode.value ? '#111' : '#eee'))

const {
  world: { size: worldSize },
} = useKonvaContext()
</script>

<template>
  <v-rect :config="{ x: 0, y: 0, ...worldSize, stroke: borderColor, strokeWidth: 0, fill }" />
</template>
