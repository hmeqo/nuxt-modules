import type { AlovaCustomTypeMeta } from '../types/alova'
import type { EventSystem } from './event'

export interface RequestInfo {
  data?: unknown
  meta?: AlovaCustomTypeMeta
  headers: Record<string, string>
  credentials?: string
}

export interface ResponseInfo {
  status: number
  ok: boolean
  headers: { get: (name: string) => string | null }
}

export class BizError extends Error {
  constructor(public response: ResponseInfo) {
    super('Business error')
  }
}

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

export const createAlovaHandlers = <R extends RequestInfo, S extends ResponseInfo>(
  emit: EventSystem<R, S>['emit'],
  opts?: CreateAlovaHandlersOpts,
) => {
  return {
    beforeRequest: (request: R) => {
      request.credentials = opts?.credentials

      const meta = request.meta
      if (meta?.multipart || request.data instanceof FormData) {
        if (!(request.data instanceof FormData)) {
          request.data = transformToFormData(request.data)
        }
      }

      emit('request:start', { request })
    },
    onSuccess: <T>(response: S, request: R, data: T): T => {
      if (!response.ok || response.status >= 400) {
        throw new BizError(response)
      }

      emit('request:success', { response, request, data })
      return data
    },
    onError: <E, T>(error: E, request: R, data: T): E => {
      if (error instanceof Error) {
        emit('request:internet_error', { error, request })
      }
      emit('request:error', { request, error, data })
      throw { error, request, data }
    },
    onComplete: (request: R) => {
      emit('request:complete', { request })
    },
  }
}
