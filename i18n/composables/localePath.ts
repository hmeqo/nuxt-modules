let cachedLocalePath: ReturnType<typeof useLocalePath>

export const useCachedLocalePath = () => {
  return (cachedLocalePath ??= useLocalePath())
}

export const $localePath = (...opts: Parameters<ReturnType<typeof useLocalePath>>) => {
  return useCachedLocalePath()(...opts)
}
