export const qExceptNone = (q: Record<string, unknown>) => {
  return Object.fromEntries(Object.entries(q).filter(([k, v]) => v))
}
