// 1. 基础图形属性
export interface BaseShape {
  id: string
  x: number
  y: number
  rotation: number
  stroke?: string
  strokeWidth?: number
}

// 2. 矩形特有属性
export interface RectShape extends BaseShape {
  type: 'rect'
  width: number
  height: number
  // 矩形绝对没有 radius
}

// 3. 圆形特有属性
export interface CircleShape extends BaseShape {
  type: 'circle'
  radius: number
  // 圆形绝对没有 width/height
}

// 4. 联合类型 (关键！)
export type ShapeData = RectShape | CircleShape

// 5. 绘图模式
export type DrawingMode = 'select' | 'rect' | 'circle'

// 6. 几何数据接口 (用于计算过程中的纯数据)
export interface GeometryData {
  x: number
  y: number
  rotation: number
  width?: number
  height?: number
  radius?: number
}
