import { panBy, zoomAtPoint } from '../lib/utils'
import type {
  InteractionConfig,
  KonvaContext,
  KonvaCtxEvents,
  KonvaCtxMeta,
  KonvaFitMode,
  KonvaMouseEvent,
  KonvaWheelEvent,
  MouseButton,
  Point,
  Size,
  Transform,
} from '../types'

const KEY: InjectionKey<KonvaContext> = Symbol('KonvaContext')

export function defineKonvaContext(
  containerRef: Ref<HTMLElement | null>,
  logicalSize: Size,
  interactionConfig: InteractionConfig = {},
) {
  // --- State Initialization ---
  const screenSize = ref<Size>({ width: 1, height: 1 })
  const worldSize = ref(logicalSize)

  const transform = ref<Transform>({ x: 0, y: 0, scale: 1 })
  const mode = ref<KonvaFitMode>('auto')

  const mouseScreen = ref({ x: 0, y: 0 })
  const isMouseInside = ref(false)
  const isDragging = ref(false)

  const mouseWorld = computed(() => {
    return screenToWorld(mouseScreen.value)
  })

  // --- Helpers ---
  const screenToWorld = (pos: Point): Point => {
    const t = transform.value
    return { x: (pos.x - t.x) / t.scale, y: (pos.y - t.y) / t.scale }
  }

  const worldToScreen = (pos: Point): Point => {
    const t = transform.value
    return { x: pos.x * t.scale + t.x, y: pos.y * t.scale + t.y }
  }

  const switchMode = (target: KonvaFitMode) => {
    mode.value = target
  }

  // --- Context Construction ---
  const context = {
    // --- 状态 (State) ---
    containerRef,
    mode,
    screen: {
      screenSize: screenSize,
      center: computed(() => ({ x: screenSize.value.width / 2, y: screenSize.value.height / 2 })),
      stageConfig: computed(() => screenSize.value),
    },
    world: {
      size: worldSize,
      center: computed(() => ({ x: worldSize.value.width / 2, y: worldSize.value.height / 2 })),
      transform,
      layerConfig: computed(() => ({
        x: transform.value.x,
        y: transform.value.y,
        scaleX: transform.value.scale,
        scaleY: transform.value.scale,
      })),
    },
    mouse: {
      screen: mouseScreen,
      world: mouseWorld,
      isInside: isMouseInside,
      isDragging,
    },
    meta: ref<KonvaCtxMeta>({}),
    // --- 事件总线 (Event Bus) ---
    events: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map: new Proxy(<Record<string, ((...args: any[]) => any)[]>>{}, {
        get: (target, key: string) => {
          return target[key] || (target[key] = [])
        },
      }),
      on: <T extends keyof KonvaCtxEvents>(event: T, cb: KonvaCtxEvents[T]) => context.events.map[event]!.push(cb),
      emit: <T extends keyof KonvaCtxEvents>(event: T, ...params: Parameters<KonvaCtxEvents[T]>) =>
        context.events.map[event]!.forEach((cb) => cb(...params)),
      remove: <T extends keyof KonvaCtxEvents>(event: T, cb: KonvaCtxEvents[T]) =>
        context.events.map[event]!.splice(context.events.map[event]!.indexOf(cb), 1),
      binding: {
        onMousemove: (e: KonvaMouseEvent) => context.events.emit('mousemove', e),
        onMouseenter: (e: KonvaMouseEvent) => context.events.emit('mouseenter', e),
        onMouseleave: (e: KonvaMouseEvent) => context.events.emit('mouseleave', e),
        onMousedown: (e: KonvaMouseEvent) => context.events.emit('mousedown', e),
        onMouseup: (e: KonvaMouseEvent) => context.events.emit('mouseup', e),
        onWheel: (e: KonvaWheelEvent) => context.events.emit('wheel', e),
      },
    },
    // --- 工具函数 (Helpers) ---
    screenToWorld,
    worldToScreen,
    switchMode,
  }

  // --- Activate Sub-modules ---
  useContainerObserver(context)
  useGlobalMouseTracker(context)
  useAutoFit(context)
  useManualInteraction(context, interactionConfig)

  // Provide
  provide(KEY, context)

  return context
}

export function useKonvaContext() {
  const ctx = inject(KEY)
  if (!ctx) throw new Error('KonvaContext not found')
  return ctx
}

/**
 * 监听容器大小变化
 */
function useContainerObserver(ctx: KonvaContext) {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      // 使用 contentRect 获取精确像素大小
      ctx.screen.screenSize.value = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }
    }
    ctx.events.emit('resize')
  })

  onMounted(() => {
    if (ctx.containerRef.value) observer.observe(ctx.containerRef.value)
  })
  onBeforeUnmount(() => {
    observer.disconnect()
  })
}

/**
 * 全局鼠标位置追踪 (基础能力)
 */
function useGlobalMouseTracker(ctx: KonvaContext) {
  ctx.events.on('mousemove', (e) => {
    const stage = e.target.getStage()
    const pointer = stage?.getPointerPosition()
    if (pointer) {
      ctx.mouse.screen.value = { x: pointer.x, y: pointer.y }
    }
  })

  ctx.events.on('mouseenter', () => (ctx.mouse.isInside.value = true))

  ctx.events.on('mouseleave', () => {
    ctx.mouse.isInside.value = false
  })
}

/**
 * 自动适应模式 (Object-Contain)
 */
function useAutoFit(ctx: KonvaContext) {
  const update = () => {
    if (ctx.mode.value !== 'auto') return
    ctx.world.transform.value = computeContain(ctx.screen.screenSize.value, ctx.world.size.value)
  }

  // 监听屏幕或世界尺寸变化，自动重算
  watch([ctx.screen.screenSize, ctx.world.size, ctx.mode], update, { immediate: true })
}

const btnMap: Record<MouseButton, number> = {
  left: 0,
  middle: 1,
  right: 2,
}

/**
 * 手动交互模式 (Zoom & Pan)
 */
function useManualInteraction(ctx: KonvaContext, config: InteractionConfig) {
  // 默认配置
  const { zoomKey = null, panButton = ['middle'], minScale = 0.05, maxScale = 50 } = config

  let lastX = 0
  let lastY = 0

  // --- Pan Logic ---
  ctx.events.on('mousedown', (e) => {
    if (ctx.mode.value !== 'manual') return

    if (!Object.entries(btnMap).some(([k, x]) => panButton.includes(k as MouseButton) && x === e.evt.button)) return

    ctx.mouse.isDragging.value = true
    lastX = e.evt.clientX
    lastY = e.evt.clientY
  })

  ctx.events.on('mousemove', (e) => {
    if (ctx.mode.value !== 'manual' || !ctx.mouse.isDragging.value) return

    const deltaX = e.evt.clientX - lastX
    const deltaY = e.evt.clientY - lastY

    // 更新 Transform
    ctx.world.transform.value = panBy(ctx.world.transform.value, deltaX, deltaY)

    lastX = e.evt.clientX
    lastY = e.evt.clientY
  })

  ctx.events.on('mouseup', () => {
    ctx.mouse.isDragging.value = false
  })

  // --- Zoom Logic ---
  ctx.events.on('wheel', (e) => {
    if (ctx.mode.value !== 'manual') return

    // 检查修饰键
    if (zoomKey === 'ctrl' && !e.evt.ctrlKey) return
    if (zoomKey === 'shift' && !e.evt.shiftKey) return
    if (zoomKey === 'meta' && !e.evt.metaKey) return

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const factor = direction > 0 ? 1.1 : 0.9

    // 使用当前的屏幕鼠标位置作为缩放中心
    const center = ctx.mouse.screen.value

    ctx.world.transform.value = zoomAtPoint(ctx.world.transform.value, factor, center, {
      min: minScale,
      max: maxScale,
    })
  })
}
