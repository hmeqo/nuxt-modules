<script setup lang="ts">
import type { ModuleOptions } from '../types'

const config = useRuntimeConfig().public.watermark as ModuleOptions
</script>

<template>
  <Teleport to="#teleports">
    <div
      :style="{ gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))` }"
      class="z-50 fixed left-0 top-0 hidden print:grid content-center justify-center gap-36 w-full h-full"
    >
      <div v-for="i in config.count" :key="i" class="flex items-center justify-center">
        <div class="text-6 text-[hsla(0,0%,100%,25%)] whitespace-pre break-keep rotate--45">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
