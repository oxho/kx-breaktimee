const clock = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const dateOnly = /^\d{4}-\d{2}-\d{2}$/

function dateKey (date) {
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function normalizeBusyTimes (rows) {
  if (!Array.isArray(rows) || rows.length > 30) throw new Error('最多可保存 30 个时段。')
  return rows.map(row => {
    const title = typeof row?.title === 'string' ? row.title.trim() : ''
    if (!title || title.length > 60 ||
        typeof row.start !== 'string' || !clock.test(row.start) ||
        typeof row.end !== 'string' || !clock.test(row.end) || row.start === row.end ||
        !['daily', 'weekdays', 'once'].includes(row.repeat)) throw new Error('请填写名称、有效起止时间和重复方式。')
    let date = ''
    if (row.repeat === 'once') {
      date = typeof row.date === 'string' ? row.date : ''
      if (!dateOnly.test(date) || dateKey(new Date(`${date}T12:00:00`)) !== date) throw new Error('请为单次时段填写有效日期。')
    }
    return { title, start: row.start, end: row.end, repeat: row.repeat, date }
  })
}

function onDay (day, time, plusDay = 0) {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + plusDay, hours, minutes).getTime()
}

function latestEnd (time, rows) {
  const current = new Date(time)
  const previous = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1, 12)
  let end = time
  for (const day of [current, previous]) {
    for (const row of rows) {
      if (row.repeat === 'once' && row.date !== dateKey(day)) continue
      if (row.repeat === 'weekdays' && [0, 6].includes(day.getDay())) continue
      const from = onDay(day, row.start)
      const to = onDay(day, row.end, Number(row.end < row.start))
      if (from <= time && time < to) end = Math.max(end, to)
    }
  }
  return end
}

export function busyDelay (rows, from = Date.now(), lead = 0) {
  let schedule
  try {
    schedule = normalizeBusyTimes(rows ?? [])
  } catch {
    return 0
  }
  let time = from
  const limit = from + 24 * 60 * 60 * 1000
  while (time < limit) {
    const ahead = latestEnd(time + lead, schedule)
    const end = Math.max(latestEnd(time, schedule), ahead > time + lead ? ahead : time)
    if (end === time) return time - from
    time = end
  }
  return limit - from
}
