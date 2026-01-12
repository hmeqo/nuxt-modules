export {}

// export function useDebounce<A extends unknown[]>(fn: (...args: A) => void, delay = 300): (...args: A) => void {
//   let timeout: NodeJS.Timeout
//   return (...args: A) => {
//     clearTimeout(timeout)
//     timeout = setTimeout(() => {
//       fn(...args)
//     }, delay)
//   }
// }
