import { createAlova } from 'alova'
import fetchAdapter from 'alova/fetch'
import VueHook from 'alova/vue'
import { toString } from 'lodash'
import {
  RequestCompleteEvent,
  RequestErrorEvent,
  RequestInternetErrorEvent,
  RequestStartEvent,
  RequestSuccessEvent
} from './event'

export const alovaInst = createAlova({
  baseURL: '/api',
  statesHook: VueHook,
  requestAdapter: fetchAdapter(),
  beforeRequest(method) {
    method.config.credentials = 'include'

    method.config.headers[useCsrf().headerName] = useCookie('csrftoken').value

    const data = method.data
    if (method.meta?.multipart || data instanceof FormData) {
      if (!(data instanceof FormData)) {
        const formData = new FormData()
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
          formData.append(key, value instanceof Blob ? value : toString(value))
        }
        method.data = formData
      }
    }

    new RequestStartEvent(method).emit()
  },
  cacheFor: null,
  responded: {
    async onSuccess(response, method) {
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        const data = await response.json()
        if (response.status >= 400) {
          new RequestErrorEvent(response, method, data).emit()
          throw response
        }
        new RequestSuccessEvent(response, method, data).emit()
        return data
      }
      if (response.status >= 400) {
        new RequestErrorEvent(response, method).emit()
        throw response
      }
      new RequestSuccessEvent(response, method, null).emit()
      return await response.text()
    },
    async onError(response: Response | Error, method) {
      if (response instanceof Error) {
        new RequestInternetErrorEvent(response, method).emit()
      } else {
        if (response.headers.get('Content-Type')?.includes('application/json')) {
          new RequestErrorEvent(response, method, await response.json()).emit()
        } else {
          new RequestErrorEvent(response, method).emit()
        }
      }
      throw response
    },
    async onComplete(method) {
      new RequestCompleteEvent(method).emit()
    }
  }
})
