<script setup lang="ts">
import type { ButtonProps, PopconfirmProps } from 'naive-ui'
import type { RouteLocationRaw } from 'vue-router'

type BtnProps = {
  to?: RouteLocationRaw
  show?: boolean
  disabled?: boolean
  class?: string | Record<string, unknown>
  type?: ButtonProps['type']
  size?: ButtonProps['size']
  icon?: string
  text?: string
  onclick?: (e: MouseEvent) => void
  vNode?: VNode
  quaternary?: boolean
  popup?: {
    text: string
    onPositiveClick: PopconfirmProps['onPositiveClick']
    onNegativeClick?: PopconfirmProps['onNegativeClick']
  }
}

defineProps<{
  buttons: BtnProps[]
}>()
</script>

<template>
  <NFlex size="small">
    <div v-for="(i, index) in buttons" :key="index">
      <component :is="i.vNode" v-if="'vNode' in i" />
      <NPopconfirm
        v-else-if="i.popup"
        @positive-click="i.popup.onPositiveClick"
        @negative-click="i.popup.onNegativeClick"
      >
        {{ i.popup.text }}
        <template #trigger>
          <NButton
            v-show="i.show === undefined ? true : i.show"
            :class="i.class"
            :type="i.type"
            :disabled="i.disabled"
            size="small"
            :secondary="!i.quaternary"
            :quaternary="i.quaternary"
          >
            <div v-if="i.icon" :class="i.icon" />
            <div v-else>
              {{ i.text }}
            </div>
          </NButton>
        </template>
      </NPopconfirm>
      <NuxtLink v-else :to="i.to" @click="i.onclick">
        <NButton
          v-show="i.show === undefined ? true : i.show"
          :class="i.class"
          :type="i.type"
          :disabled="i.disabled"
          size="small"
          secondary
          :quaternary="i.quaternary"
        >
          <div v-if="i.icon" :class="i.icon" />
          <div v-else>
            {{ i.text }}
          </div>
        </NButton>
      </NuxtLink>
    </div>
  </NFlex>
</template>
