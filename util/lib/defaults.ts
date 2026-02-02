export const defineDefaults =
  <T>(defaultOrGetter: T | (() => T)) =>
  (overrides?: Partial<T>): T => ({
    ...(defaultOrGetter instanceof Function ? defaultOrGetter() : defaultOrGetter),
    ...overrides,
  })
