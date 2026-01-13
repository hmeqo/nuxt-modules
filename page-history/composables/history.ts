import type { RouteLocationNormalizedGeneric } from 'vue-router'

type Path = {
  name: string
  path: string
  title: string
  icon?: string
}

export const usePageHistory = () => {
  const paths = usePiniaState<Path[]>('page-history-paths', { default: () => [] })
  const enabledStore = usePiniaCache<StrBoolean>('page-history-enabled', { default: () => 'true' })
  const enabled = computed({ get: () => enabledStore.value === 'true', set: (v) => (enabledStore.value = `${v}`) })

  function clearPaths(opts?: { exceptCurrent?: boolean }) {
    if (opts?.exceptCurrent) {
      const route = useRoute()
      paths.value = paths.value.filter((x) => x.name !== route.name)
    } else {
      paths.value = []
    }
  }

  function addPath(path: Path | RouteLocationNormalizedGeneric) {
    if ('meta' in path) {
      if (!path.meta.title || !path.meta.tags) return
      if (paths.value.some((x) => x.name === path.name)) return
      paths.value.push({
        name: path.name as string,
        path: path.fullPath,
        title: path.meta.title,
        icon: path.meta.icon,
      })
    } else if ('tags' in path && 'title' in path) {
      if (paths.value.some((x) => x.name === path.name)) return
      paths.value.push(path)
    }
  }

  function removePath(path: Path | string) {
    const route = useRoute()
    if (paths.value.length <= 1) throw new Error('没有历史记录可以回退了')
    const name = typeof path === 'string' ? path : path.name
    const index = paths.value.findIndex((x) => x.name === name)
    paths.value = paths.value.filter((x) => x.name !== name)
    if (route.name === name) {
      navigateTo(paths.value[Math.min(index, paths.value.length - 1)]!.path)
    }
  }

  return {
    enabled,
    paths,
    addPath,
    removePath,
    clearPaths,
  }
}
