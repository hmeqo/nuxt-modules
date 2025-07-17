<script setup lang="ts">
withDefaults(
  defineProps<{
    loadingBarProps?: { navigation?: boolean }
  }>(),
  {
    loadingBarProps: () => ({})
  }
)
</script>

<template>
  <NLoadingBarProvider>
    <NaiveLoadingBar :navigation="loadingBarProps.navigation" />
    <NNotificationProvider>
      <NaiveNotification />
      <NDialogProvider>
        <NMessageProvider>
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
