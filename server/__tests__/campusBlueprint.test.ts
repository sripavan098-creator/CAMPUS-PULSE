import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../index.js'

/**
 * Regression coverage for the campus-map white screen and the faculty names
 * that rendered as raw ids.
 *
 * 1. `FloorBlueprint` maps `floor.blueprintElements` unconditionally, so the
 *    endpoint must always return the array or the page crashes.
 * 2. The SPA resolves an entry's `facultyId` against `/api/faculty` ids, so the
 *    timetable shaper must emit the id (not the display name).
 */
describe('campus blueprint & faculty ids', () => {
  it('returns blueprint geometry for every floor so the map can render', async () => {
    const res = await request(app).get('/api/floors')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)

    for (const floor of res.body) {
      expect(Array.isArray(floor.blueprintElements)).toBe(true)
      expect(floor.blueprintElements.length).toBeGreaterThan(0)
      expect(Array.isArray(floor.roomIds)).toBe(true)
    }

    const withRooms = res.body.find((f: any) => f.roomIds.length > 0)
    expect(withRooms).toBeTruthy()
    const roomTiles = withRooms.blueprintElements.filter((e: any) => e.roomId)
    expect(roomTiles.length).toBe(withRooms.roomIds.length)
    for (const tile of roomTiles) {
      expect(withRooms.roomIds).toContain(tile.roomId)
      expect(tile.width).toBeGreaterThan(0)
      expect(tile.height).toBeGreaterThan(0)
    }
  })

  it('emits timetable facultyId values that resolve against /api/faculty', async () => {
    const [tt, fac] = await Promise.all([
      request(app).get('/api/timetables'),
      request(app).get('/api/faculty')
    ])
    expect(tt.status).toBe(200)
    expect(fac.status).toBe(200)

    const ids = new Set(fac.body.map((f: any) => f.id))
    const referenced = new Set(
      tt.body.map((e: any) => e.facultyId).filter((v: any) => typeof v === 'string' && v.length > 0)
    )
    expect(referenced.size).toBeGreaterThan(0)
    for (const ref of referenced) {
      expect(ids.has(ref as string)).toBe(true)
    }
  })
})
