import 'dotenv/config'
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import * as XLSX from 'xlsx'
import app from '../index.js'
import { prisma } from '../lib/prisma.js'
import { campusNow } from '../lib/time.js'

/**
 * Covers the defects fixed on this branch:
 *  - room type/capacity and group size are real, not constants
 *  - approve re-runs all five hard constraints
 *  - the import pipeline actually parses .xlsx
 *  - the ICS export contains DTSTART/DTEND
 *  - availability/now is campus-local
 */
describe('phase-2 fixes', () => {
  let adminCookie = ''
  let csrf = ''

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_SEED_EMAIL || 'admin@vignan.ac.in',
        password: process.env.ADMIN_SEED_PASSWORD || ''
      })
    const cookies = login.headers['set-cookie'] as unknown as string[]
    adminCookie = cookies.find(c => c.startsWith('cp_session='))!.split(';')[0]

    const csrfRes = await request(app).get('/api/auth/csrf')
    csrf = csrfRes.body.csrfToken
  })

  it('seeds real room type and capacity', async () => {
    const lab = await prisma.room.findUnique({ where: { id: 'N-617' } })
    expect(lab?.type).toBe('Laboratory')
    expect(lab?.capacity).toBeGreaterThan(0)

    const classroom = await prisma.room.findUnique({ where: { id: 'N-215' } })
    expect(classroom?.type).toBe('Classroom')
  })

  it('seeds the demo group with a real size', async () => {
    const group = await prisma.group.findUnique({ where: { name: 'II AIML-J' } })
    expect(group?.size).toBeGreaterThan(0)
  })

  it('campusNow returns an IST day and time, not the server clock', () => {
    // 18:45 UTC is 00:15 the next day in Asia/Kolkata.
    const now = campusNow(new Date('2026-08-17T18:45:00Z'))
    expect(now.time).toBe('00:15')
    expect(now.day).toBe('TUE')
  })

  it('availability/now accepts an instant and resolves it in campus time', async () => {
    const res = await request(app).get('/api/availability/now?at=2026-08-17T18:45:00Z')
    expect(res.status).toBe(200)
    expect(res.body.time).toBe('00:15')
    expect(res.body.day).toBe('TUE')
  })

  it('parses a real .xlsx upload into staged entries', async () => {
    const rows = [
      ['Day', 'Time', 'Subject', 'Room', 'Group'],
      ['MON', '08:15-09:05', 'Data Structures & Algorithms', 'N-217', 'II AIML-J'],
      ['MON', '09:05-09:55', 'Machine Learning Lab', 'N-617', 'II AIML-J'],
      ['TUE', '10:00-10:50', 'Operating Systems', 'N-607', 'II AIML-J']
    ]
    const sheet = XLSX.utils.aoa_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Timetable')
    const buffer = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' })

    const res = await request(app)
      .post('/api/admin/timetable/import')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', csrf)
      .attach('file', buffer, 'timetable.xlsx')

    expect(res.status).toBe(200)
    expect(res.body.stagedEntries).toBe(3)
    expect(res.body.report.rowsParsed).toBe(3)
    expect(res.body.report.roomCodeStats.total).toBeGreaterThan(0)

    const staged = await prisma.entry.findMany({
      where: { sourceFileId: res.body.sourceFileId }
    })
    expect(staged).toHaveLength(3)
    expect(staged.every(e => e.is_live === false)).toBe(true)

    const lab = staged.find(e => e.entryType === 'lab')
    expect(lab?.roomId).toBe('N-617')

    // Committing publishes them to the live schedule.
    const commit = await request(app)
      .post(`/api/admin/timetable/import/${res.body.sourceFileId}/commit`)
      .set('Cookie', adminCookie)
      .set('x-csrf-token', csrf)
    expect(commit.status).toBe(200)
    expect(commit.body.publishedEntries).toBe(3)

    // Clean up so the rest of the suite sees the original schedule.
    await prisma.entry.deleteMany({ where: { sourceFileId: res.body.sourceFileId } })
    await prisma.sourceFile.delete({ where: { id: res.body.sourceFileId } })
  })

  it('rejects a non-xlsx upload', async () => {
    const res = await request(app)
      .post('/api/admin/timetable/import')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', csrf)
      .attach('file', Buffer.from('not a spreadsheet'), 'notes.txt')
    expect(res.status).toBe(400)
  })

  it('emits an ICS calendar with DTSTART and DTEND for every event', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.STUDENT_SEED_EMAIL || 'student@vignan.ac.in',
        password: process.env.STUDENT_SEED_PASSWORD || ''
      })
    const cookies = login.headers['set-cookie'] as unknown as string[]
    const studentCookie = cookies.find(c => c.startsWith('cp_session='))!.split(';')[0]

    const res = await request(app)
      .get('/api/me/export.ics')
      .set('Cookie', studentCookie)

    expect(res.status).toBe(200)
    const body = res.text
    const events = (body.match(/BEGIN:VEVENT/g) || []).length
    // Count per-event DTSTART/DTEND lines, ignoring the VTIMEZONE's own DTSTART.
    const starts = (body.match(/DTSTART;TZID=/g) || []).length
    const ends = (body.match(/DTEND;TZID=/g) || []).length
    expect(events).toBeGreaterThan(0)
    expect(starts).toBe(events)
    expect(ends).toBe(events)
    expect(body).toContain('BEGIN:VTIMEZONE')
  })

  it('records a disruption and reports a failed-check body when approval goes stale', async () => {
    // Use any live Monday class that occupies a room, instead of a room code
    // from the retired synthetic dataset that no longer has any periods.
    const entry = await prisma.entry.findFirst({
      where: { day: 'MON', is_live: true, roomId: { not: null } }
    })
    expect(entry).not.toBeNull()
    const roomId = entry!.roomId!

    const dis = await request(app)
      .post('/api/admin/disruptions')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', csrf)
      .send({
        entryId: entry!.id,
        roomId,
        type: 'room_closure',
        reason: 'test',
        affectedDay: 'MON',
        startTime: '08:15',
        endTime: '09:05'
      })

    expect(dis.status).toBe(200)
    expect(dis.body.proposals.length).toBeGreaterThan(0)

    const proposal = dis.body.proposals[0]

    // Make the proposal stale by occupying its room with another live class.
    const filler = await prisma.entry.create({
      data: {
        roomId: proposal.roomId,
        day: proposal.newDay || 'MON',
        startTime: proposal.newStartTime || '08:15',
        endTime: proposal.newEndTime || '09:05',
        subject: 'Stale filler',
        is_live: true
      }
    })

    const approve = await request(app)
      .post(`/api/admin/proposals/${proposal.id}/approve`)
      .set('Cookie', adminCookie)
      .set('x-csrf-token', csrf)

    expect(approve.status).toBe(409)
    expect(approve.body.error.code).toBe('STALE_PROPOSAL')
    expect(Array.isArray(approve.body.failedChecks)).toBe(true)
    expect(approve.body.failedChecks).toContain('room_slot_free')

    const after = await prisma.proposal.findUnique({ where: { id: proposal.id } })
    expect(after?.status).toBe('stale')

    await prisma.entry.delete({ where: { id: filler.id } })
    await prisma.proposal.deleteMany({ where: { disruptionId: dis.body.disruption.id } })
    await prisma.disruption.delete({ where: { id: dis.body.disruption.id } })
  })
})
