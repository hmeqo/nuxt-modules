import type { BaseModel } from '@hmeqo/easymodel'
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
  statesHook: VueHook,
  requestAdapter: fetchAdapter(),
  beforeRequest(method) {
    method.config.credentials = 'include'

    Object.assign(method.config.headers, {
      [useCsrf().headerName]: useCookie('csrftoken').value,
      'Content-Type': method.config.headers['Content-Type'] ?? (method.meta?.multipart ? undefined : 'application/json')
    })

    let data = method.data
    if ((data as BaseModel)?.toRepresentation) {
      data = (data as BaseModel).toRepresentation()
      method.data = data
    }
    if (method.meta?.multipart || data instanceof FormData) {
      if (!(data instanceof FormData)) {
        const formData = new FormData()
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
          formData.append(key, toString(value))
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
        let data = await response.json()
        if (response.status >= 400) {
          new RequestErrorEvent(response, method, data).emit()
          throw response
        }
        if (method.meta?.model) {
          data = method.meta.model.init(data)
          if (method.meta.instance) Object.assign(method.meta.instance, data)
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
