<script setup lang="ts">
const props = defineProps<{
  src?: string | null
  config?: object
}>()

const {
  world: { size: worldSize },
} = useKonvaContext()

const imageObj = ref<HTMLImageElement | null>(null)

const loadImage = (url: string) => {
  const img = new Image()
  img.src = url
  img.onload = () => {
    imageObj.value = img
  }
  img.onerror = () => {
    console.error(`Failed to load image from ${url}`)
  }
}

const imageConfig = computed(() => {
  if (!imageObj.value) return {}

  const { width, height, x, y } = computeContain(worldSize.value, imageObj.value)

  return {
    image: imageObj.value,
    width,
    height,
    x,
    y,
    ...props.config,
  }
})

watch(
  () => props.src,
  (newVal) => {
    if (newVal) loadImage(newVal)
  },
  { immediate: true },
)
</script>

<template>
  <v-image v-if="imageObj" :config="imageConfig" />
</template>
