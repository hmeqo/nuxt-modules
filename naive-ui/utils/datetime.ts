import dayjs from 'dayjs'

export type DateStructure =
  | {
      type: 'date'
      year: number
      month: number
      date: number
    }
  | {
      type: 'month'
      year: number
      month: number
    }
  | {
      type: 'year'
      year: number
    }
  | {
      type: 'quarter'
      year: number
      quarter: number
    }
  | {
      type: 'input'
    }

export function naiveDisableFutureDates(timestamp: number, type: DateStructure | DateStructure['type']) {
  const dateType = typeof type === 'string' ? type : type.type
  let startOfPeriod: number

  switch (dateType) {
    case 'year':
      startOfPeriod = dayjs().startOf('year').valueOf()
      break
    case 'quarter':
      startOfPeriod = dayjs().startOf('quarter').valueOf()
      break
    case 'month':
      startOfPeriod = dayjs().startOf('month').valueOf()
      break
    case 'date':
      startOfPeriod = dayjs().startOf('day').valueOf()
      break
    default:
      return false
  }

  return timestamp >= startOfPeriod
}
