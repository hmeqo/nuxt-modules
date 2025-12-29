export const usePiniaCache = <T>(key: string, opts?: { default: () => T }) => {
  return usePiniaCacheStore().register(key, opts)
}

export const usePiniaCookie = <T>(key: string, opts?: { default: () => T }) => {
  return usePiniaCookieStore().register(key, opts)
}

export const usePiniaState = <T>(key: string, opts?: { default: () => T }) => {
  return usePiniaStateStore().register(key, opts)
}
