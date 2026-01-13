<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: string
  }>(),
  {
    color: '#888',
  },
)

const {
  screen: { screenSize, center },
} = useKonvaContext()
</script>

<template>
  <v-group>
    <v-line
      :config="{
        points: [0, center.y, screenSize.width, center.y],
        stroke: color,
        dash: [10, 5],
      }"
    />

    <v-line
      :config="{
        points: [center.x, 0, center.x, screenSize.height],
        stroke: color,
        dash: [10, 5],
      }"
    />
  </v-group>
</template>
