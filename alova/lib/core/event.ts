import type { Method } from 'alova'

export class Event {
  preventFlag = false

  emit() {
    return emitEvent(this.constructor.name, this)
  }

  prevent() {
    this.preventFlag = true
  }
}

export class RequestStartEvent extends Event {
  constructor(public method: Method) {
    super()
  }
}

export class RequestSuccessEvent<T = unknown> extends Event {
  constructor(
    public response: Response,
    public method: Method,
    public data: T
  ) {
    super()
  }
}

export class RequestErrorEvent extends Event {
  constructor(
    public response: Response,
    public method: Method,
    public error?: { code?: number; detail: string[] | string }
  ) {
    super()
  }
}

export class RequestCompleteEvent extends Event {
  constructor(public method: Method) {
    super()
  }
}

export class RequestInternetErrorEvent extends Event {
  constructor(
    public error: Error,
    public method: Method
  ) {
    super()
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const subscribers: Record<string, ((event: any) => void)[]> = {}

export function subscribe<T>(eventType: string, func: (event: T) => void) {
  subscribers[eventType] = subscribers[eventType] || []
  if (!subscribers[eventType].includes(func)) {
    unsubscribe(eventType, func)
  }
  subscribers[eventType].push(func)
  return func
}

export function unsubscribe<T>(eventType: string, func: (event: T) => void) {
  if (subscribers[eventType]) {
    subscribers[eventType] = subscribers[eventType].filter((f) => f !== func)
  }
}

export function emitEvent(eventType: string, event: Event) {
  if (!subscribers[eventType]) return
  for (const func of subscribers[eventType]) {
    if (event.preventFlag) break
    func(event)
  }
}
