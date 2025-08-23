<script setup lang="ts">
import type { CardProps, ModalProps } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    containerClass?: ClassProp
    title?: CardProps['title']
    segmented?: ModalProps['segmented']
    maskClosable?: ModalProps['maskClosable']
    escClosable?: ModalProps['closeOnEsc']
    onMaskClick?: ModalProps['onMaskClick']
    closable?: CardProps['closable']
    beforeClose?: () => boolean
    width?: number | string
    full?: boolean
  }>(),
  { closable: true, maskClosable: true, escClosable: true }
)
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:show', v: boolean): void
}>()
const show = defineModel<boolean>('show', { required: true })

function onClose() {
  if (props.beforeClose && !props.beforeClose()) {
    return false
  }
  emit('close')
  return true
}

function hasSegmented() {
  if (props.segmented === undefined) return false
  if (typeof props.segmented === 'boolean') return props.segmented
  return !!props.segmented.content
}
</script>

<template>
  <NModal
    v-model:show="show"
    class=" w-full h-[100dvh] sm:w-auto sm:h-auto sm:max-w-[96vw] sm:max-h-[96dvh] mx-auto rounded-none sm:rounded-sm"
    content-class="flex flex-col h-full shrink-1 overflow-hidden !p-0"
    :style="{ width: width ? (width.toString().match(/[\D]$/) ? width : `${Number(width) / 4}rem`) : 'auto' }"
    preset="card"
    :title="title"
    :segmented="hasSegmented()"
    :mask-closable="maskClosable"
    :close-on-esc="escClosable"
    draggable
    transform-origin="center"
    bordered
    @mask-click="maskClosable && onClose()"
    @esc="emit('close')"
    @close="onClose"
  >
    <BackGuard v-model:opened="show" />
    <template #header>
      <slot name="header" />
    </template>
    <NScrollbar
      class="flex flex-col w-full h-full overflow-hidden"
      :content-style="{
        padding: '0 var(--n-padding-left) var(--n-padding-bottom) var(--n-padding-left)',
        paddingTop: hasSegmented() ? 'var(--n-padding-top)' : '0'
      }"
    >
      <slot />
    </NScrollbar>
  </NModal>
</template>
