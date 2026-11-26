import { describe, expect, it } from 'vitest'
import { busyDelay, normalizeBusyTimes } from '../app/utils/busyTimes.js'

const time = (day, hour, minute) => +new Date(2026, 10, day, hour, minute)
const minute = 60000
const entries = [
  { title: '会议', start: '09:00', end: '10:00', repeat: 'weekdays' },
  { title: '课程', start: '09:40', end: '10:20', repeat: 'daily' },
  { title: '夜班', start: '23:00', end: '00:30', repeat: 'once', date: '2026-11-26' }
]

describe('local busy times', () => {
  it('waits for overlapping events to finish', () => {
    expect(busyDelay(entries, time(26, 9, 30))).toBe(50 * minute)
  })

  it('checks the previous day for an event spanning midnight', () => {
    expect(busyDelay(entries, time(27, 0, 15))).toBe(15 * minute)
  })

  it('does not repeat a single event or a weekday event on Saturday', () => {
    expect(busyDelay(entries, time(28, 0, 15))).toBe(0)
    expect(busyDelay(entries, time(28, 9, 30))).toBe(0)
  })

  it('defers early notifications when the break would start during a meeting', () => {
    expect(busyDelay(entries, time(26, 8, 59), 2 * minute)).toBe(81 * minute)
  })

  it('rejects a date that would roll into a different month', () => {
    expect(() => normalizeBusyTimes([{ ...entries[2], date: '2026-02-30' }])).toThrow()
  })
})
