export interface EventMap<R, S> {
  'request:start': { request: R }
  'request:success': { request: R; response: S; data: unknown }
  'request:error': { request: R; error?: unknown; data?: unknown }
  'request:complete': { request: R }
  'request:internet_error': { error: Error; request: R }
}

export type EventSubscriber<T> = (data: T) => void

export type EventSystem<R, S> = ReturnType<typeof createEventSystem<R, S>>

export const createEventSystem = <R, S>() => {
  type M = EventMap<R, S>
  const subscribers = defaultDict<keyof M, EventSubscriber<M[keyof M]>[]>(() => [])

  return {
    /// Subscribe to an event, return a function to unsubscribe
    subscribe<K extends keyof M>(type: K, handler: EventSubscriber<M[K]>) {
      subscribers[type].push(handler as EventSubscriber<M[keyof M]>)
      return () => this.unsubscribe(type, handler)
    },
    unsubscribe<K extends keyof M>(type: K, handler: EventSubscriber<M[K]>) {
      subscribers[type] = subscribers[type].filter((h) => h !== handler)
    },
    emit<K extends keyof M>(type: K, data: M[K]) {
      subscribers[type].forEach((handler) => handler(data as M[keyof M]))
    },
  }
}
