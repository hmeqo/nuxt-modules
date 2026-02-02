import { BizError, type EventGenerics, type EventSystem } from './event'

/**
 * Transform the data to FormData
 */
export const transformToFormData = (data: unknown): FormData => {
  if (data instanceof FormData) return data
  const formData = new FormData()
  if (data && typeof data === 'object' && data !== null) {
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      formData.append(key, value instanceof Blob ? value : String(value))
    })
  }
  return formData
}

export type CreateAlovaHandlersOpts = {
  credentials?: RequestCredentials
}

export const createAlovaHandlers = <
  G extends EventGenerics,
  Req extends G['Req'] = G['Req'],
  Resp extends G['Resp'] = G['Resp'],
>(
  emit: EventSystem<G>['emit'],
  opts?: CreateAlovaHandlersOpts,
) => {
  return {
    beforeRequest: (request: Req) => {
      request.credentials = opts?.credentials

      const meta = request.meta
      if (meta?.multipart || request.data instanceof FormData) {
        if (!(request.data instanceof FormData)) {
          request.data = transformToFormData(request.data)
        }
      }

      emit('request:start', { request })
    },
    onSuccess: <T>(response: Resp, request: Req, data: T): T => {
      if (!response.ok || response.status >= 400) {
        const error = new BizError(response, request, data)
        emit('request:bizerror', { error, request, data })
        emit('request:error', { request, error, data })
        throw error
      }
      emit('request:success', { response, request, data })
      return data
    },
    onError: <E, T>(error: E, request: Req, data: T) => {
      emit('request:unknown_error', { request, error, data })
      emit('request:error', { request, error, data })
    },
    onComplete: (request: Req) => {
      emit('request:complete', { request })
    },
  }
}
