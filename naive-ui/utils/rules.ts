import dayjs from 'dayjs'
import type { FormItemRule } from 'naive-ui'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ensureValid = (fn: (_: FormItemRule, value: any) => boolean): FormItemRule['validator'] => {
  return (_, value) => {
    if (value === null || value === undefined) return true
    return fn(_, value)
  }
}

export const naiveRulePresets = {
  length: (opts: { min?: number; max?: number }): FormItemRule => {
    if (opts.min !== undefined && opts.max !== undefined)
      return {
        validator: ensureValid((_, value) => value.length >= opts.min! && value.length <= opts.max!),
        message: `长度应在 ${opts.min} 到 ${opts.max} 之间`,
        trigger: ['blur']
      }
    if (opts.max !== undefined)
      return {
        validator: ensureValid((_, value) => value.length <= opts.max!),
        message: `长度不能超过 ${opts.max}`,
        trigger: ['blur']
      }
    if (opts.min !== undefined)
      return {
        validator: ensureValid((_, value) => value.length >= opts.min!),
        message: `长度应该大于 ${opts.min}`,
        trigger: ['blur']
      }
    throw new Error('min or max must be provided')
  },
  textLength: (opts: { min?: number; max?: number }): FormItemRule => {
    if (opts.min !== undefined && opts.max !== undefined)
      return {
        pattern: new RegExp(`^.{${opts.min},${opts.max}}$`),
        message: `长度应在 ${opts.min} 到 ${opts.max} 之间`,
        trigger: ['blur']
      }
    if (opts.max !== undefined)
      return {
        pattern: new RegExp(`^.{0,${opts.max}}$`),
        message: `不能超过 ${opts.max} 个字符`,
        trigger: ['blur']
      }
    if (opts.min !== undefined)
      return {
        pattern: new RegExp(`^.{${opts?.min},}$`),
        message: `至少需要 ${opts.min} 个字符`,
        trigger: ['blur']
      }
    throw new Error('min or max must be provided')
  },
  date: (): FormItemRule => ({
    validator: ensureValid((_, value) => value === null || dayjs(value).startOf('day') <= dayjs().startOf('day')),
    message: '日期不能大于今天',
    trigger: ['input', 'blur']
  }),
  datetime: (): FormItemRule => ({
    validator: ensureValid((_, value) => value === null || dayjs(value) <= dayjs()),
    message: '时间不能大于现在',
    trigger: ['input', 'blur']
  }),
  posNumber: (): FormItemRule => ({
    validator: ensureValid((_, value: number) => value >= 0),
    message: '必须大于等于0',
    trigger: ['input', 'blur']
  }),
  notUndefined: (): FormItemRule => ({
    validator: (_, value) => value !== undefined,
    message: '不能为空值',
    trigger: ['blur']
  }),
  notNull: (): FormItemRule => ({ validator: (_, value) => value !== null, message: '不能为空值', trigger: ['blur'] }),
  required: (): FormItemRule => ({ validator: (_, value) => !!value, message: '不能为空', trigger: ['blur'] }),
  number: (opts: { min?: number; max?: number }): FormItemRule => {
    if (opts.min !== undefined && opts.max !== undefined)
      return {
        validator: ensureValid((_, value) => value >= opts.min! && value <= opts.max!),
        message: `数值应在 ${opts.min} 到 ${opts.max} 之间`,
        trigger: ['blur']
      }
    if (opts.max !== undefined)
      return {
        validator: ensureValid((_, value) => value <= opts.max!),
        message: `数值不能超过 ${opts.max}`,
        trigger: ['blur']
      }
    if (opts.min !== undefined)
      return {
        validator: ensureValid((_, value) => value >= opts.min!),
        message: `数值应该大于 ${opts.min}`,
        trigger: ['blur']
      }
    throw new Error('min or max must be provided')
  },
  pattern: (opts: { pattern: string | RegExp }): FormItemRule => {
    return {
      pattern: opts.pattern instanceof RegExp ? opts.pattern : new RegExp(opts.pattern!),
      message: '输入格式无效',
      trigger: ['blur']
    }
  }
}
