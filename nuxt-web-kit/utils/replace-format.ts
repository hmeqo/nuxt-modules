/**
 * Example: format('hello {name}', { name: 'John' })
 */
export function rFormat(s: string, args: Record<string, any>) {
  return Object.entries(args).reduce((acc: string, [key, arg]) => acc.replace(`{${key}}`, arg), s)
}
