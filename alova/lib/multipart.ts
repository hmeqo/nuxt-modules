/**
 * Web 平台专用 multipart 中间件。
 * 仅在 Admin 前端（fetch adapter）中使用，uniapp 端不引用此文件。
 *
 * uniapp 端的上传走 `@alova/adapter-uniapp` 的 `requestType: 'upload'` → `uni.uploadFile()`，
 * 不需要 FormData 转换。
 */

import type { RequestInfo } from './event'

export function transformToFormData(data: unknown): FormData {
  if (data instanceof FormData) return data
  const formData = new FormData()
  if (data && typeof data === 'object' && data !== null) {
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      formData.append(key, value instanceof Blob ? value : String(value))
    })
  }
  return formData
}

export function multipartBeforeRequest(request: RequestInfo) {
  if (request.meta?.multipart || request.data instanceof FormData) {
    if (!(request.data instanceof FormData)) {
      request.data = transformToFormData(request.data)
    }
  }
}
