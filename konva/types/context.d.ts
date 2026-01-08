import type Konva from 'konva'

export type Size = { width: number; height: number }
export type Point = { x: number; y: number }

// 变换矩阵仅包含位置和缩放，尺寸由 World Size 决定
export type Transform = Point & { scale: number }

export type MouseButton = 'middle' | 'left' | 'right'

export type Modifier = 'ctrl' | 'meta' | 'shift'

export type InteractionConfig = {
  zoomKey?: Modifier | null // null 表示直接滚轮缩放
  panButton?: MouseButton[]
  minScale?: number
  maxScale?: number
}

export type KonvaMouseEvent = Konva.KonvaPointerEvent & { evt: PointerEvent }
export type KonvaWheelEvent = Konva.KonvaPointerEvent & { evt: WheelEvent }

// 事件回调类型
type PointerCallback = (e: KonvaMouseEvent) => void
type WheelCallback = (e: KonvaWheelEvent) => void

export type KonvaCtxEvents = {
  resize: () => void
  mousemove: PointerCallback
  mouseenter: PointerCallback
  mouseleave: PointerCallback
  mousedown: PointerCallback
  mouseup: PointerCallback
  wheel: WheelCallback
}

export type KonvaCtxMeta = object

export type KonvaFitMode = 'auto' | 'manual'

export type KonvaContext = ReturnType<(typeof import('../composables/konvaContext'))['defineKonvaContext']>
