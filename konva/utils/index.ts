// 计算 Object-Contain
export function computeContain(container: Size, inner: Size) {
  const scale = Math.min(container.width / inner.width, container.height / inner.height)

  const width = inner.width * scale
  const height = inner.height * scale
  const x = (container.width - width) / 2
  const y = (container.height - height) / 2

  return {
    width,
    height,
    x,
    y,
    scale,
  }
}
