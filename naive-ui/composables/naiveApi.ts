import type { DialogApi, LoadingBarApi, MessageApi, NotificationApi } from 'naive-ui'

let cachedNaiveApi: {
  message: MessageApi
  dialog: DialogApi
  notification: NotificationApi
  loadingBar: LoadingBarApi
}

export const useNaiveApi = (opts?: { loadingBarDisabled?: boolean; refresh: boolean }) => {
  if (opts?.refresh) cachedNaiveApi = undefined as unknown as typeof cachedNaiveApi
  return (cachedNaiveApi ??= {
    message: useMessage(),
    dialog: useDialog(),
    notification: useNotification(),
    loadingBar: opts?.loadingBarDisabled
      ? {
          start: () => {},
          finish: () => {},
          error: () => {},
        }
      : useLoadingBar(),
  })
}
