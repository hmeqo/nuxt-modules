type Raw = Record<string, unknown> | Ref<Record<string, unknown>>

export const stringNumberConverter = (raw: Raw, key: string) => {
  return computed({
    get: () => (unref(raw)[key] as number).toString(),
    set: (value) => {
      unref(raw)[key] = Number(value)
    }
  })
}

export const numberStringConverter = (raw: Raw, key: string) => {
  return computed({
    get: () => Number(unref(raw)[key]),
    set: (value) => {
      unref(raw)[key] = value.toString()
    }
  })
}

export const numberISODatetimeConverter = (raw: Raw, key: string) => {
  return computed({
    get: () => new Date(unref(raw)[key] as Date).getTime(),
    set: (value) => {
      unref(raw)[key] = new Date(value).toISOString()
    }
  })
}
