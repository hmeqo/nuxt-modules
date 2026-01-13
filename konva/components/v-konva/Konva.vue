<script setup lang="ts">
import type { Size } from '../../types'

const props = withDefaults(
  defineProps<{
    worldSize?: Size
    fill?: string
  }>(),
  {
    worldSize: () => ({ width: 640, height: 480 }),
  },
)

const containerRef = useTemplateRef('containerRef')

const context = defineKonvaContext(containerRef, props.worldSize)
const {
  events: { binding },
  screen: { stageConfig },
  world: { layerConfig },
} = context
</script>

<template>
  <div ref="containerRef" class="relative w-full h-full bg-background overflow-hidden">
    <v-stage :config="stageConfig" v-bind="binding">
      <v-layer :config="layerConfig">
        <slot />
      </v-layer>

      <v-layer :config="layerConfig">
        <slot name="foreground" />
      </v-layer>

      <v-layer>
        <slot name="overlay" />
      </v-layer>
    </v-stage>
    <slot name="container-overlay" />
  </div>
</template>
