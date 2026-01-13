<script setup lang="ts">
import VueDraggable from 'vuedraggable'

withDefaults(
  defineProps<{
    placeholder?: string
    btnSize?: 'tiny' | 'small' | 'medium' | 'large'
    tagProps?: Record<string, unknown>
  }>(),
  {
    placeholder: '',
    btnSize: 'small',
    tagProps: () => ({}),
  },
)

const tags = defineModel<string[]>('value', { default: [] })

const newTag = ref('')
const showInput = ref(false)
const inputRef = useTemplateRef('input')

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
  }
  newTag.value = ''
  showInput.value = false
}

const removeTag = (index: number) => {
  tags.value.splice(index, 1)
}

const startAdd = () => {
  showInput.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <VueDraggable v-if="tags.length" v-model="tags" class="flex flex-wrap gap-2" item-key="index" handle=".tag-handle">
      <template #item="{ element: tag, index }">
        <NTag class="tag-handle cursor-move" closable v-bind="tagProps" @close="removeTag(index)">
          {{ tag }}
        </NTag>
      </template>
    </VueDraggable>
    <NInput
      v-if="showInput"
      ref="input"
      v-model:value="newTag"
      class="min-w-16"
      autosize
      :size="btnSize"
      :placeholder="placeholder"
      @blur="addTag"
      @keydown.enter="addTag"
      @keydown.escape="showInput = false"
    />
    <NButton v-else :size="btnSize" dashed ghost @click="startAdd">
      <template #icon>
        <NIcon>
          <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M256 112V400M400 256H112"
              stroke="currentColor"
              stroke-width="32"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </NIcon>
      </template>
    </NButton>
  </div>
</template>
