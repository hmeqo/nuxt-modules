<script setup lang="ts">
import type Konva from 'konva'
import type { CircleShape, DrawingMode, GeometryData, RectShape, ShapeData } from '../../types'

const props = defineProps<{ drawingColor?: string }>()
const emit = defineEmits<{ (e: 'select', id: string | null): void }>()

// 使用定义的类型
const shapes = defineModel<ShapeData[]>('modelValue', { default: [] })
const mode = defineModel<DrawingMode>('mode', { default: 'select' })

// 假设 useKonvaContext 返回了正确的 Ref 类型
const { world, mouse } = useKonvaContext()

// --- 绘图状态 ---
const drawState = reactive({
  active: false,
  start: { x: 0, y: 0 },
})

// 定义策略接口
interface ShapeStrategy<T extends ShapeData> {
  getGeometry(start: { x: number; y: number }, current: { x: number; y: number }): Partial<T>
  normalize(node: Konva.Node, base: T): Partial<T>
  isValid(geometry: Partial<T>): boolean
}

// 策略实现映射
const ShapeStrategies: Record<'rect' | 'circle', ShapeStrategy<ShapeData>> = {
  rect: {
    getGeometry(start, current) {
      const w = current.x - start.x
      const h = current.y - start.y
      return {
        x: w < 0 ? current.x : start.x,
        y: h < 0 ? current.y : start.y,
        width: Math.abs(w),
        height: Math.abs(h),
        rotation: 0,
      }
    },
    normalize(node, base) {
      const rectNode = node as Konva.Rect
      return {
        width: Math.max(5, base.width * rectNode.scaleX()),
        height: Math.max(5, base.height * rectNode.scaleY()),
      }
    },
    isValid(g) {
      return (g.width ?? 0) >= 5 && (g.height ?? 0) >= 5
    },
  } as ShapeStrategy<RectShape>,
  circle: {
    getGeometry(start, current) {
      const dx = current.x - start.x
      const dy = current.y - start.y
      return {
        x: start.x,
        y: start.y,
        radius: Math.sqrt(dx * dx + dy * dy),
        rotation: 0,
      }
    },
    normalize(node, base) {
      const circleNode = node as Konva.Circle
      return {
        radius: Math.max(2, base.radius * circleNode.scaleX()),
      }
    },
    isValid(g) {
      return (g.radius ?? 0) >= 2
    },
  } as ShapeStrategy<CircleShape>,
}

// 计算预览图形 (Ghost)
// 返回类型必须兼容 Konva 配置对象
const ghostConfig = computed(
  (): (GeometryData & { stroke: string; strokeWidth: number; listening: boolean }) | null => {
    if (mode.value === 'select' || !drawState.active) return null

    const strategy = ShapeStrategies[mode.value]
    const geometry = strategy.getGeometry(drawState.start, mouse.world.value)

    return {
      x: 0,
      y: 0,
      rotation: 0, // 默认值防空
      ...geometry,
      stroke: props.drawingColor || 'yellow',
      strokeWidth: 2,
      listening: false,
    }
  },
)

// --- 选中状态 ---
// Transformer 的类型是 Konva.Transformer
const transformerRef = useTemplateRef<Konva.Transformer>('transformerRef')

const updateSelection = (nodes: Konva.Node[]) => {
  // 访问 Konva 实例需要用 .getNode() (如果是 vue-konva 的组件引用)
  // 或者如果 transformerRef 直接绑定到了 Konva 实例则直接使用
  // 这里假设 ref 绑定的是 vue-konva 组件实例，它通常有一个 getNode() 方法
  const tr = transformerRef.value?.getNode?.() as Konva.Transformer | undefined

  if (tr) {
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }
  emit('select', nodes[0]?.id() ?? null)
}

// ==========================================
// 3. 事件处理 (Controller)
// ==========================================

const onBoardMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
  if (e.evt.button !== 0) return

  if (mode.value === 'select') {
    updateSelection([])
    return
  }

  e.evt.stopPropagation()
  drawState.active = true
  drawState.start = { ...mouse.world.value }
}

const onBoardMouseUp = () => {
  if (!drawState.active) return

  const config = ghostConfig.value
  const currentMode = mode.value

  // 类型守卫：确保 mode 不是 'select'
  if (currentMode !== 'select' && config) {
    const strategy = ShapeStrategies[currentMode]

    // 这里 config 包含了很多属性，我们需要断言它符合特定形状的 Partial
    if (strategy.isValid(config)) {
      // 构造新数据，利用 Discriminated Unions 的特性
      let newShape: ShapeData

      const commonProps = {
        id: crypto.randomUUID(),
        x: config.x,
        y: config.y,
        rotation: 0,
        stroke: props.drawingColor,
      }

      if (currentMode === 'rect') {
        newShape = {
          ...commonProps,
          type: 'rect',
          width: config.width!, // 确信 rect 策略会返回 width
          height: config.height!,
        }
      } else {
        newShape = {
          ...commonProps,
          type: 'circle',
          radius: config.radius!, // 确信 circle 策略会返回 radius
        }
      }

      shapes.value = [...shapes.value, newShape]
    }
  }
  drawState.active = false
}

// 选中图形
const onShapeDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
  if (e.evt.button !== 0) return

  if (mode.value !== 'select') return
  e.cancelBubble = true
  updateSelection([e.target])
}

// 变形结束
const onTransformEnd = (e: Konva.KonvaEventObject<Event>, item: ShapeData) => {
  const node = e.target // 这里 node 是 Konva.Node
  const currentMode = item.type // 'rect' | 'circle'
  const strategy = ShapeStrategies[currentMode]

  // 1. 基础变换
  const baseTransform = {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
  }

  // 2. 归一化 (TS 知道 item 是 ShapeData，strategy 也是对应的)
  const normalized = strategy.normalize(node, item)

  // 3. 更新数组
  const index = shapes.value.findIndex((s) => s.id === item.id)
  if (index > -1) {
    const newShapes = [...shapes.value]
    // 强制类型合并，TS 有时无法推断扩展运算后的联合类型，需要 assert
    newShapes[index] = { ...item, ...baseTransform, ...normalized } as ShapeData
    shapes.value = newShapes
  }

  // 4. 重置 Scale
  node.scaleX(1)
  node.scaleY(1)
}
</script>

<template>
  <v-group>
    <!-- 背景层 -->
    <v-rect
      :config="{
        width: world.size.value.width,
        height: world.size.value.height,
        fill: 'transparent',
        listening: true,
      }"
      @mousedown="onBoardMouseDown"
      @mouseup="onBoardMouseUp"
    />

    <!-- 已有图形 -->
    <template v-for="item in shapes" :key="item.id">
      <component
        :is="item.type === 'rect' ? 'v-rect' : 'v-circle'"
        :config="{
          ...item,
          draggable: mode === 'select',
          stroke: item.stroke || drawingColor || 'yellow',
          strokeWidth: 2,
          name: 'vision-shape',
          listening: mode === 'select',
        }"
        @mousedown="onShapeDown"
        @transformend="(e: any) => onTransformEnd(e, item)"
        @dragend="(e: any) => onTransformEnd(e, item)"
        @mouse.middle.prevent
      />
    </template>

    <!-- 预览图形 -->
    <component
      :is="mode === 'rect' ? 'v-rect' : 'v-circle'"
      v-if="ghostConfig && mode !== 'select'"
      :config="ghostConfig"
    />

    <!-- Transformer -->
    <v-transformer
      ref="transformerRef"
      :config="{
        anchorSize: 9,
        borderStroke: '#00ff00',
        borderDash: [4, 4],
        keepRatio: false,
      }"
    />
  </v-group>
</template>
