// 计算定点缩放
export function zoomAtPoint(
  current: Transform,
  factor: number,
  center: Point,
  limits: { min: number; max: number }
): Transform {
  const newScale = Math.max(limits.min, Math.min(limits.max, current.scale * factor))

  // 公式: NewPos = Center - (Center - OldPos) * (NewScale / OldScale)
  // 简化后:
  const worldX = (center.x - current.x) / current.scale
  const worldY = (center.y - current.y) / current.scale

  return {
    scale: newScale,
    x: center.x - worldX * newScale,
    y: center.y - worldY * newScale
  }
}

// 计算平移
export function panBy(current: Transform, dx: number, dy: number): Transform {
  return { ...current, x: current.x + dx, y: current.y + dy }
}
