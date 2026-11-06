import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import app from '../index.js'
import { prisma } from '../lib/prisma.js'

/**
 * Phase 2 (accounts) and Phase 3 (swap / replace) coverage.
 *
 * These tests build their own faculty, section-mates and entries so they do not
 * depend on the demo seed beyond the ACSE department and the II AIML-J group.
 */
describe('accounts, swap and replace', () => {
  const stamp = Date.now()
  const createdEntryIds: string[] = []
  const createdFacultyIds: string[] = []
  const createdUserIds: string[] = []
  const createdRequestIds: string[] = []

  let adminToken = ''
  let deptId = ''
  let groupId = ''
  let groupName = 'II AIML-J'
  let roomId = ''

  // Faculty A/B teach the demo section; C teaches a different section.
  let facultyA = ''
  let facultyB = ''
  let facultyC = ''
  let tokenA = ''
  let tokenB = ''
  let tokenC = ''

  const emailA = `test-fac-a-${stamp}@vignan.ac.in`
  const emailB = `test-fac-b-${stamp}@vignan.ac.in`
  const emailC = `test-fac-c-${stamp}@vignan.ac.in`
  const password = 'TestFaculty@2026'

  async function createFacultyUser(code: string, name: string, email: string, departmentId: string) {
    const faculty = await prisma.faculty.create({ data: { code, name, departmentId, is_mock: true } })
    createdFacultyIds.push(faculty.id)
    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        role: 'faculty',
        name,
        facultyId: faculty.id,
      },
    })
    createdUserIds.push(user.id)
    const login = await request(app).post('/api/auth/login').send({ email, password })
    return { facultyId: faculty.id, token: login.body.token as string }
  }

  async function createEntry(opts: {
    groupId: string
    facultyId: string | null
    roomId: string | null
    day: string
    startTime: string
    endTime: string
    subject: string
  }) {
    const entry = await prisma.entry.create({
      data: { ...opts, entryType: 'class', is_live: true, is_mock: true },
    })
    createdEntryIds.push(entry.id)
    return entry
  }

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_SEED_EMAIL || 'admin@vignan.ac.in',
        password: process.env.ADMIN_SEED_PASSWORD || '',
      })
    adminToken = adminLogin.body.token

    const dept = await prisma.department.findFirstOrThrow({ where: { code: 'ACSE' } })
    deptId = dept.id
    const group = await prisma.group.findFirstOrThrow({ where: { name: groupName } })
    groupId = group.id
    const room = await prisma.room.findFirstOrThrow()
    roomId = room.id

    const a = await createFacultyUser(`TEST-A-${stamp}`, `Test Faculty A ${stamp}`, emailA, deptId)
    const b = await createFacultyUser(`TEST-B-${stamp}`, `Test Faculty B ${stamp}`, emailB, deptId)
    const c = await createFacultyUser(`TEST-C-${stamp}`, `Test Faculty C ${stamp}`, emailC, deptId)
    facultyA = a.facultyId
    facultyB = b.facultyId
    facultyC = c.facultyId
    tokenA = a.token
    tokenB = b.token
    tokenC = c.token
  })

  afterAll(async () => {
    if (createdRequestIds.length) {
      await prisma.scheduleRequest.deleteMany({ where: { id: { in: createdRequestIds } } })
    }
    await prisma.scheduleRequest.deleteMany({ where: { requesterId: { in: createdFacultyIds } } })
    if (createdEntryIds.length) {
      await prisma.entry.deleteMany({ where: { id: { in: createdEntryIds } } })
    }
    if (createdUserIds.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } })
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    }
    if (createdFacultyIds.length) {
      await prisma.faculty.deleteMany({ where: { id: { in: createdFacultyIds } } })
    }
    await prisma.user.deleteMany({ where: { email: { contains: `signup-${stamp}` } } })
  })

  // -------------------------------------------------------------------------
  // Phase 2: accounts
  // -------------------------------------------------------------------------
  describe('Phase 2 - student self-signup', () => {
    it('registers a student and lets them log in', async () => {
      const email = `signup-${stamp}@vignan.ac.in`
      const res = await request(app).post('/api/auth/signup/student').send({
        name: 'Signup Tester',
        rollNumber: '211FA04001',
        email,
        password: 'Student@Signup2026',
        section: groupName,
      })

      expect(res.status).toBe(201)
      expect(res.body.user).toMatchObject({ email, role: 'student', sectionId: groupName })

      const login = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'Student@Signup2026' })
      expect(login.status).toBe(200)
      expect(login.body.user.role).toBe('student')
      expect(login.body.user.sectionId).toBe(groupName)
    })

    it('rejects a duplicate email with 409', async () => {
      const email = `signup-${stamp}@vignan.ac.in`
      const res = await request(app).post('/api/auth/signup/student').send({
        name: 'Signup Tester',
        rollNumber: '211FA04002',
        email,
        password: 'Student@Signup2026',
        section: groupName,
      })
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('EMAIL_TAKEN')
    })

    it('rejects a section that does not exist', async () => {
      const res = await request(app).post('/api/auth/signup/student').send({
        name: 'No Section',
        rollNumber: '211FA04003',
        email: `signup-nosec-${stamp}@vignan.ac.in`,
        password: 'Student@Signup2026',
        section: 'XII NOPE-Z',
      })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_SECTION')
    })

    it('rejects a malformed roll number', async () => {
      const res = await request(app).post('/api/auth/signup/student').send({
        name: 'Bad Roll',
        rollNumber: 'not-a-roll',
        email: `signup-badroll-${stamp}@vignan.ac.in`,
        password: 'Student@Signup2026',
        section: groupName,
      })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Phase 2 - admin creates a faculty login', () => {
    it('creates a linked faculty User that must change its password on first login', async () => {
      const email = `provisioned-${stamp}@vignan.ac.in`
      const res = await request(app)
        .post('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `TEST-PROV-${stamp}`,
          name: `Provisioned Faculty ${stamp}`,
          departmentId: deptId,
          email,
          tempPassword: 'TempFaculty@2026',
        })

      expect(res.status).toBe(201)
      expect(res.body.faculty.code).toBe(`TEST-PROV-${stamp}`)
      expect(res.body.user).toMatchObject({ email, role: 'faculty' })
        // The bcrypt hash must never leave the server.
        expect(res.body.user.password).toBeUndefined()
      createdFacultyIds.push(res.body.faculty.id)
      createdUserIds.push(res.body.user.id)

      const login = await request(app).post('/api/auth/login').send({ email, password: 'TempFaculty@2026' })
      expect(login.status).toBe(200)
      expect(login.body.user.mustChangePassword).toBe(true)
      const token = login.body.token

      // Blocked from normal routes until the password is rotated.
      const blocked = await request(app)
        .get('/api/faculty/me/timetable')
        .set('Authorization', `Bearer ${token}`)
      expect(blocked.status).toBe(403)
      expect(blocked.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED')

      // Wrong current password is refused.
      const wrong = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'nope-nope-nope', newPassword: 'BrandNew@2026' })
      expect(wrong.status).toBe(401)

      const changed = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'TempFaculty@2026', newPassword: 'BrandNew@2026' })
      expect(changed.status).toBe(200)
      expect(changed.body.mustChangePassword).toBe(false)

      // Now the same session can reach the faculty surface.
      const allowed = await request(app)
        .get('/api/faculty/me/timetable')
        .set('Authorization', `Bearer ${token}`)
      expect(allowed.status).toBe(200)
    })

    it('refuses faculty-login creation for non-admins', async () => {
      const res = await request(app)
        .post('/api/admin/faculty')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ code: `TEST-NOAUTH-${stamp}`, name: 'Nope', email: `nope-${stamp}@vignan.ac.in` })
      expect(res.status).toBe(403)
    })
  })

  // -------------------------------------------------------------------------
  // Phase 3: swap
  // -------------------------------------------------------------------------
  describe('Phase 3 - faculty swap', () => {
    it('swaps two periods once the counterpart accepts', async () => {
      const e1 = await createEntry({ groupId, facultyId: facultyA, roomId, day: 'MON', startTime: '08:15', endTime: '09:05', subject: 'Swap Src' })
      const e2 = await createEntry({ groupId, facultyId: facultyB, roomId, day: 'MON', startTime: '09:05', endTime: '09:55', subject: 'Swap Tgt' })

      const created = await request(app)
        .post('/api/faculty/me/requests/swap')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ sourceEntryId: e1.id, targetEntryId: e2.id })
      expect(created.status).toBe(201)
      createdRequestIds.push(created.body.request.id)

      const accepted = await request(app)
        .post(`/api/faculty/me/requests/${created.body.request.id}/accept`)
        .set('Authorization', `Bearer ${tokenB}`)
      expect(accepted.status).toBe(200)
      expect(accepted.body.request.status).toBe('accepted')

      const [after1, after2] = await Promise.all([
        prisma.entry.findUniqueOrThrow({ where: { id: e1.id } }),
        prisma.entry.findUniqueOrThrow({ where: { id: e2.id } }),
      ])
      expect(after1.facultyId).toBe(facultyB)
      expect(after2.facultyId).toBe(facultyA)
    })

    it('rejects a swap that would leave a faculty member double-booked', async () => {
      const src = await createEntry({ groupId, facultyId: facultyA, roomId, day: 'MON', startTime: '10:45', endTime: '11:35', subject: 'Conflict Src' })
      const tgt = await createEntry({ groupId, facultyId: facultyB, roomId, day: 'TUE', startTime: '08:15', endTime: '09:05', subject: 'Conflict Tgt' })
      // A already teaches TUE 08:15, so taking the target would collide.
      await createEntry({ groupId, facultyId: facultyA, roomId, day: 'TUE', startTime: '08:15', endTime: '09:05', subject: 'A busy' })

      const res = await request(app)
        .post('/api/faculty/me/requests/swap')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ sourceEntryId: src.id, targetEntryId: tgt.id })
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('SWAP_CONFLICT')
    })

    it('refuses to swap a period the requester does not own', async () => {
      const mine = await createEntry({ groupId, facultyId: facultyA, roomId, day: 'WED', startTime: '08:15', endTime: '09:05', subject: 'Mine' })
      const theirs = await createEntry({ groupId, facultyId: facultyB, roomId, day: 'WED', startTime: '09:05', endTime: '09:55', subject: 'Theirs' })

      const res = await request(app)
        .post('/api/faculty/me/requests/swap')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ sourceEntryId: mine.id, targetEntryId: theirs.id })
      expect(res.status).toBe(403)
    })

    it('refuses to decide a request aimed at someone else', async () => {
      const src = await createEntry({ groupId, facultyId: facultyA, roomId, day: 'THU', startTime: '08:15', endTime: '09:05', subject: 'Decide Src' })
      const tgt = await createEntry({ groupId, facultyId: facultyB, roomId, day: 'THU', startTime: '09:05', endTime: '09:55', subject: 'Decide Tgt' })

      const created = await request(app)
        .post('/api/faculty/me/requests/swap')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ sourceEntryId: src.id, targetEntryId: tgt.id })
      expect(created.status).toBe(201)
      createdRequestIds.push(created.body.request.id)

      const res = await request(app)
        .post(`/api/faculty/me/requests/${created.body.request.id}/accept`)
        .set('Authorization', `Bearer ${tokenC}`)
      expect(res.status).toBe(403)
    })
  })

  // -------------------------------------------------------------------------
  // Phase 3: replace
  // -------------------------------------------------------------------------
  describe('Phase 3 - faculty replace', () => {
    let srcEntryId = ''
    let sameSectionEntryId = ''

    beforeAll(async () => {
      const src = await createEntry({ groupId, facultyId: facultyA, roomId, day: 'FRI', startTime: '08:15', endTime: '09:05', subject: 'Replace Src' })
      srcEntryId = src.id
      // B teaches the same section, so B is a valid substitute.
      const mate = await createEntry({ groupId, facultyId: facultyB, roomId, day: 'FRI', startTime: '09:55', endTime: '10:45', subject: 'B section mate' })
      sameSectionEntryId = mate.id
      // C teaches a different section only.
      const otherGroup = await prisma.group.findFirstOrThrow({ where: { name: { not: groupName } } })
      await createEntry({ groupId: otherGroup.id, facultyId: facultyC, roomId, day: 'FRI', startTime: '08:15', endTime: '09:05', subject: 'C other section' })
    })

    it('lists only same-section faculty who are free in the slot', async () => {
      const res = await request(app)
        .get(`/api/faculty/me/replacement-candidates?entryId=${srcEntryId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      const ids = res.body.candidates.map((c: { id: string }) => c.id)
      expect(ids).toContain(facultyB)
      expect(ids).not.toContain(facultyC)
      expect(ids).not.toContain(facultyA)
    })

    it('hands the period to the substitute once accepted', async () => {
      const created = await request(app)
        .post('/api/faculty/me/requests/replace')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ sourceEntryId: srcEntryId, substituteFacultyId: facultyB, reason: 'Conference' })
      expect(created.status).toBe(201)
      createdRequestIds.push(created.body.request.id)

      const accepted = await request(app)
        .post(`/api/faculty/me/requests/${created.body.request.id}/accept`)
        .set('Authorization', `Bearer ${tokenB}`)
      expect(accepted.status).toBe(200)

      const entry = await prisma.entry.findUniqueOrThrow({ where: { id: srcEntryId } })
      expect(entry.facultyId).toBe(facultyB)
      expect(sameSectionEntryId).toBeTruthy()
    })

    it('refuses a substitute who does not teach the section', async () => {
      const src = await createEntry({ groupId, facultyId: facultyA, roomId, day: 'SAT', startTime: '08:15', endTime: '09:05', subject: 'Wrong Section Src' })
      const res = await request(app)
        .post('/api/faculty/me/requests/replace')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ sourceEntryId: src.id, substituteFacultyId: facultyC })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('WRONG_SECTION')
    })
  })

  // -------------------------------------------------------------------------
  // Phase 3: admin oversight
  // -------------------------------------------------------------------------
  describe('Phase 3 - admin oversight', () => {
    it('lists schedule requests and can override a decision', async () => {
      const src = await createEntry({ groupId, facultyId: facultyA, roomId, day: 'MON', startTime: '11:35', endTime: '12:25', subject: 'Override Src' })
      const tgt = await createEntry({ groupId, facultyId: facultyB, roomId, day: 'MON', startTime: '13:20', endTime: '14:10', subject: 'Override Tgt' })

      const created = await request(app)
        .post('/api/faculty/me/requests/swap')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ sourceEntryId: src.id, targetEntryId: tgt.id })
      expect(created.status).toBe(201)
      createdRequestIds.push(created.body.request.id)

      const list = await request(app)
        .get('/api/admin/schedule-requests')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(list.status).toBe(200)
      expect(Array.isArray(list.body.requests)).toBe(true)
      expect(list.body.requests.some((r: { id: string }) => r.id === created.body.request.id)).toBe(true)

      const override = await request(app)
        .post(`/api/admin/schedule-requests/${created.body.request.id}/override`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'accept' })
      expect(override.status).toBe(200)
      expect(override.body.request.status).toBe('accepted')

      const [after1, after2] = await Promise.all([
        prisma.entry.findUniqueOrThrow({ where: { id: src.id } }),
        prisma.entry.findUniqueOrThrow({ where: { id: tgt.id } }),
      ])
      expect(after1.facultyId).toBe(facultyB)
      expect(after2.facultyId).toBe(facultyA)
    })

    it('keeps the admin surface closed to faculty', async () => {
      const res = await request(app)
        .get('/api/admin/schedule-requests')
        .set('Authorization', `Bearer ${tokenA}`)
      expect(res.status).toBe(403)
    })
  })
})
