/**
 * @example
 * fillI18nLocaleRecords({ 'hello': 'Hello' }, { 'hello': '你好', 'welcome': '欢迎' })
 * => { 'hello': 'Hello', 'welcome': 'Welcome' }
 */
export function fillI18nLocaleRecords(
  current: Record<string, string>,
  reference?: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = { ...current }
  for (const key in reference || current) {
    if (result?.[key] === undefined) {
      const parts = key.split('$')
      const lastPart = parts[parts.length - 1] || ''
      result[key] = lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
    }
  }
  return result
}
