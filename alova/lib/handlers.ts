import { BizError, type EventGenerics, type EventSystem } from './event'

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
      // alova 把 onError 的返回值当成"已恢复"，必须抛出才能让请求保持失败
      throw error
    },
    onComplete: (request: Req) => {
      emit('request:complete', { request })
    },
  }
}
