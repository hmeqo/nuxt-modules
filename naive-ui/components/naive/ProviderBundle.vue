<script setup lang="ts">
withDefaults(
  defineProps<{
    loadingBarProps?: { navigation?: boolean }
  }>(),
  {
    loadingBarProps: () => ({}),
  },
)
</script>

<template>
  <NLoadingBarProvider>
    <NaiveLoadingBar :navigation="loadingBarProps.navigation" />
    <NNotificationProvider container-class="[&>*>*>*>*>*]:border-card">
      <NaiveNotification />
      <NDialogProvider>
        <NMessageProvider container-class="[&>*]:(border-card rounded)">
          <NModalProvider>
            <NaiveApiProvider>
              <slot />
            </NaiveApiProvider>
          </NModalProvider>
        </NMessageProvider>
      </NDialogProvider>
    </NNotificationProvider>
  </NLoadingBarProvider>
</template>
