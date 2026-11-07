import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const dataPath = join(here, '..', 'data', 'all_compiled_timetables.json')

type Entry = {
  group: string
  day: string
  startTime: string
  endTime: string
  subject: string
  room: string | null
  faculty: string | null
  entryType: string
}

const data = JSON.parse(readFileSync(dataPath, 'utf8')) as {
  groups: { name: string }[]
  entries: Entry[]
}

describe('Compiled timetable dataset', () => {
  // II MTECH(DS) is listed in the department workbook but has no periods filled
  // in at all (only BREAK/LUNCH markers), so it is legitimately empty.
  const KNOWN_EMPTY = new Set(['II MTECH(DS)'])

  it('covers every section with a full week of periods', () => {
    const byGroup = new Map<string, Entry[]>()
    for (const e of data.entries) {
      if (!byGroup.has(e.group)) byGroup.set(e.group, [])
      byGroup.get(e.group)!.push(e)
    }
    for (const g of data.groups) {
      const entries = byGroup.get(g.name) || []
      if (KNOWN_EMPTY.has(g.name)) {
        expect(entries.length, `${g.name} has no periods`).toBe(0)
        continue
      }
      expect(entries.length, `${g.name} has entries`).toBeGreaterThan(0)
      // Saturdays are often "ACTIVITIES" rather than classes, so five teaching
      // days is a complete week for some departments.
      const days = new Set(entries.map(e => e.day))
      expect(days.size, `${g.name} spans the week`).toBeGreaterThanOrEqual(5)
    }
  })

  // A double period is written as one merged cell. A parser that reads only the
  // merge's top-left cell drops the second half, which is exactly the bug this
  // suite guards against: II AIML-J Monday showed OOPS once instead of twice.
  it('keeps both halves of a merged double period (II AIML-J Monday OOPS)', () => {
    const oops = data.entries.filter(
      e => e.group === 'II AIML-J' && e.day === 'MON' && e.startTime < '10:00'
    )
    const times = oops.map(e => e.startTime).sort()
    expect(times).toEqual(['08:15', '09:05'])
  })

  it('has no two periods starting at the same time in one section', () => {
    const seen = new Set<string>()
    for (const e of data.entries) {
      const key = `${e.group}|${e.day}|${e.startTime}`
      expect(seen.has(key), `duplicate slot ${key}`).toBe(false)
      seen.add(key)
    }
  })

  it('never schedules more than nine periods in a single day', () => {
    const perDay = new Map<string, number>()
    for (const e of data.entries) {
      const key = `${e.group}|${e.day}`
      perDay.set(key, (perDay.get(key) || 0) + 1)
    }
    for (const [key, count] of perDay) {
      expect(count, `${key} period count`).toBeLessThanOrEqual(9)
    }
  })
})
