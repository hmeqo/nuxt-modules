import type { DialogOptions } from 'naive-ui'

export const naiveDialogOptionPresets = {
  upload: <DialogOptions>{
    title: '上传文件',
    content: '确认上传?',
    type: 'info'
  },
  delete: <DialogOptions>{
    title: '删除数据',
    content: '确认删除?',
    type: 'error'
  },
  warning: <DialogOptions>{
    title: '警告',
    content: '确认操作?',
    type: 'warning'
  },
  save: <DialogOptions>{
    title: '保存数据',
    content: '确认保存?',
    type: 'info'
  },
  submit: <DialogOptions>{
    title: '提交数据',
    content: '确认提交?',
    type: 'info'
  },
  confirm: <DialogOptions>{
    title: '确认操作',
    content: '确认操作?',
    type: 'info'
  },
  logout: <DialogOptions>{
    title: '退出登录',
    content: '确认退出登录?',
    type: 'warning'
  },
  resetPwd: <DialogOptions>{
    title: '重置密码',
    content: '重置后将退出已登录的设备, 确认重置?',
    type: 'warning'
  }
}

export function naiveCreateDialog(options: DialogOptions) {
  const { dialog } = useNaiveApi()
  const result = dialog.create({
    class: 'border-card',
    transformOrigin: 'center',
    negativeText: '取消',
    positiveText: '确认',
    maskClosable: true,
    ...options,
    onNegativeClick: (e) => {
      options?.onNegativeClick?.(e)
      // message.info($t(i18nKeys.canceled))
    },
    onPositiveClick: (e) => {
      if (!options.onPositiveClick) return
      result.loading = true
      options.onPositiveClick(e)
      result.loading = false
    },
    onEsc: () => {
      options?.onClose?.()
      // message.info($t(i18nKeys.canceled))
    },
    onClose: () => {
      options?.onClose?.()
      // message.info($t(i18nKeys.canceled))
    },
    onMaskClick: (e) => {
      options?.onClose?.()
      // message.info($t(i18nKeys.canceled))
    }
  })
  return result
}

export function naiveShowDialog(options: Omit<DialogOptions, 'onEsc' | 'onMaskClick'>) {
  return new Promise((resolve, reject) =>
    naiveCreateDialog({
      ...options,
      onPositiveClick(event) {
        options?.onPositiveClick?.(event)
        resolve(undefined)
      },
      onNegativeClick(event) {
        options?.onNegativeClick?.(event)
        reject(new AbortError())
      },
      onClose() {
        options?.onClose?.()
        reject(new AbortError())
      }
    })
  )
}
