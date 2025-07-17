export const $t = (key: string | number) => {
  return useCachedI18n().t(key)
}
