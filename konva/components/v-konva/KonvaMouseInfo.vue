<script setup lang="ts">
const {
  mouse: { isInside, screen, world },
} = useKonvaContext()
</script>

<template>
  <v-group v-if="isInside" :config="{ x: screen.x + 15, y: screen.y + 15 }">
    <!-- 背景框 -->
    <v-rect :config="{ width: 140, height: 50, fill: 'rgba(0,0,0,0.8)', cornerRadius: 6, shadowBlur: 5 }" />

    <v-text
      :config="{
        text: `Screen: ${Math.round(screen.x)}, ${Math.round(screen.y)}`,
        x: 10,
        y: 10,
        fill: '#aaa',
        fontSize: 11,
      }"
    />

    <v-text
      :config="{
        text: `World: ${Math.round(world.x)}, ${Math.round(world.y)}`,
        x: 10,
        y: 28,
        fill: '#4ade80',
        fontSize: 13,
        fontStyle: 'bold',
      }"
    />
  </v-group>
</template>
