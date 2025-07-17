import type { BaseModel, ModelType } from '@hmeqo/easymodel'

export interface AlovaCustomTypeMeta {
  model?: ModelType
  instance?: BaseModel
  multipart?: boolean
}

declare module 'alova' {
  export interface AlovaCustomTypes {
    meta: AlovaCustomTypeMeta
  }
}
