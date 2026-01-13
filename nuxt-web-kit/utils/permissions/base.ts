export function getPermission(...permissions: Permission[]): Permission | undefined {
  for (const p of permissions) {
    if (p.verify()) return p
  }
}

export function hasPermission(...permissions: Permission[]): boolean {
  return !!getPermission(...permissions)
}

export type Permission = {
  verify(): boolean
}

export function createPermission(verify: Permission['verify']): Permission {
  return {
    verify() {
      return verify()
    },
  }
}
