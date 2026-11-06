import { Router, Request, Response, NextFunction } from 'express'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { log } from '../lib/logger.js'
import multer from 'multer'
import fs from 'fs'
import crypto from 'crypto'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { findRepairOptions, verifyHardConstraints, CandidateRoom, ConstraintCheckResult } from '../../src/engine/repairSearch.js'
import { ScheduledEntry, DisruptionRecord } from '../../src/engine/intervalSearch.js'
import { parseWorkbook } from '../lib/timetableParser.js'
import { applyScheduleRequest } from '../lib/scheduleRequests.js'

const router = Router()
router.use(requireAuth)
router.use(requireRole('admin'))

const uploadDir = 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.toLowerCase().endsWith('.xlsx')
    ) {
      cb(null, true)
    } else {
      cb(new Error('Only .xlsx files are permitted'))
    }
  }
})

const DAY_MAP_TO_NUM: Record<string, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 7
}

function getPagination(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

// Multer rejects disallowed files by calling back with an Error, which Express
// would otherwise surface as a 500. Turn that into a clean 400.
const uploadSingle = (field: string) => (req: Request, res: Response, next: NextFunction) => {
  upload.single(field)(req, res, err => {
    if (err) {
      res.status(400).json({ error: { code: 'INVALID_FILE_TYPE', message: err.message } })
      return
    }
    next()
  })
}

// POST /api/admin/timetable/import
router.post('/timetable/import', uploadSingle('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'NO_FILE_UPLOADED', message: 'No file uploaded.' } })
    return
  }

  // Magic bytes check for zip/xlsx (PK\x03\x04)
  const fd = fs.openSync(req.file.path, 'r')
  const header = Buffer.alloc(4)
  fs.readSync(fd, header, 0, 4, 0)
  fs.closeSync(fd)

  if (header[0] !== 0x50 || header[1] !== 0x4b) {
    fs.unlinkSync(req.file.path)
    res.status(400).json({
      error: { code: 'INVALID_FILE_TYPE', message: 'Uploaded file is not a valid Excel (.xlsx) file.' }
    })
    return
  }

  const fileBytes = fs.readFileSync(req.file.path)
  const sha256 = crypto.createHash('sha256').update(fileBytes).digest('hex')

  const existing = await prisma.sourceFile.findUnique({ where: { sha256 } })
  if (existing) {
    fs.unlinkSync(req.file.path)
    res.status(409).json({
      error: { code: 'FILE_ALREADY_EXISTS', message: 'This file has already been imported.' },
      sourceFileId: existing.id,
      status: existing.status
    })
    return
  }

  // Parse the workbook for real. Every room code goes through the Section 5
  // rule table, and every row becomes a staged Entry so /commit has something
  // to publish.
  const knownRooms = await prisma.room.findMany({ select: { id: true } })
  const knownRoomIds = new Set(knownRooms.map(r => r.id))

  let parsed
  try {
    parsed = parseWorkbook(fileBytes, { knownRoomIds })
  } catch (err) {
    fs.unlinkSync(req.file.path)
    res.status(400).json({
      error: { code: 'PARSE_FAILED', message: `Could not read the workbook: ${(err as Error).message}` }
    })
    return
  }

  const groups = await prisma.group.findMany({ select: { id: true, name: true, section: true } })
  const groupByName = new Map(groups.map(g => [g.name.toUpperCase(), g.id]))
  const faculty = await prisma.faculty.findMany({ select: { id: true, code: true, name: true } })
  const facultyByName = new Map<string, string>()
  for (const f of faculty) {
    facultyByName.set(f.name.toUpperCase(), f.id)
    facultyByName.set(f.code.toUpperCase(), f.id)
  }

  const resolveGroup = (raw: string | null) => {
    if (!raw) return null
    return groupByName.get(raw.trim().toUpperCase()) || null
  }
  const resolveFaculty = (raw: string | null) => {
    if (!raw) return null
    return facultyByName.get(raw.trim().toUpperCase()) || null
  }

  const report = {
    filename: req.file.originalname,
    sha256,
    sizeBytes: req.file.size,
    status: 'staged',
    sheet: parsed.sheet,
    layout: parsed.layout,
    rowsSeen: parsed.rowsSeen,
    rowsParsed: parsed.entries.length,
    rowsUnmapped: parsed.unmapped.length,
    unmapped: parsed.unmapped.slice(0, 25),
    roomCodeStats: parsed.roomCodeStats,
    unknownCodes: parsed.unknownCodes,
    unresolvedCodes: parsed.unresolvedCodes,
    distinctRooms: parsed.distinctRooms,
    note: 'Staged outside web root. Use /commit to publish to the live schedule.'
  }

  const sourceFile = await prisma.sourceFile.create({
    data: {
      filename: req.file.originalname,
      sha256,
      status: 'staged',
      report: JSON.stringify(report)
    }
  })

  let stagedCount = 0
  for (const e of parsed.entries) {
    await prisma.entry.create({
      data: {
        sourceFileId: sourceFile.id,
        groupId: resolveGroup(e.groupRaw),
        facultyId: resolveFaculty(e.facultyRaw),
        roomId: e.roomId,
        day: e.day,
        startTime: e.startTime,
        endTime: e.endTime,
        subject: e.subject,
        entryType: e.entryType,
        is_live: false
      }
    })
    stagedCount++
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'timetable.import',
      entity: 'SourceFile',
      entityId: sourceFile.id,
      detail: `Staged ${req.file.originalname}: parsed ${parsed.entries.length} rows, ${parsed.unmapped.length} unmapped, ${stagedCount} entries staged`
    }
  })

  res.json({ sourceFileId: sourceFile.id, report, stagedEntries: stagedCount })
})

// POST /api/admin/timetable/import/:id/commit
router.post('/timetable/import/:id/commit', async (req: AuthRequest, res: Response) => {
  const sourceFile = await prisma.sourceFile.findUnique({ where: { id: req.params.id } })
  if (!sourceFile) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Source file not found.' } })
    return
  }

  if (sourceFile.status === 'committed') {
    res.status(409).json({ error: { code: 'ALREADY_COMMITTED', message: 'Source file is already committed.' } })
    return
  }

  await prisma.sourceFile.update({
    where: { id: req.params.id },
    data: { status: 'committed', committedAt: new Date() }
  })

  const updatedEntries = await prisma.entry.updateMany({
    where: { sourceFileId: req.params.id },
    data: { is_live: true }
  })

  // Clean up any uploaded temp file
  const uploadedFiles = fs.readdirSync(uploadDir)
  for (const f of uploadedFiles) {
    try {
      fs.unlinkSync(`${uploadDir}/${f}`)
    } catch { }
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'timetable.commit',
      entity: 'SourceFile',
      entityId: req.params.id,
      detail: `Published ${updatedEntries.count} entries to live schedule`
    }
  })

  res.json({ ok: true, sourceFileId: req.params.id, publishedEntries: updatedEntries.count })
})

// GET /api/admin/entries?group=&day=
router.get('/entries', async (req: Request, res: Response) => {
  const { group, day } = req.query as { group?: string; day?: string }
  const { limit, skip, page } = getPagination(req)

  const where: any = {}
  if (day) where.day = day.toUpperCase()
  if (group) {
    const g = await prisma.group.findFirst({ where: { OR: [{ id: group }, { name: group }] } })
    if (g) where.groupId = g.id
  }

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      include: {
        room: true,
        faculty: { select: { id: true, name: true, code: true } },
        group: true
      },
      skip,
      take: limit,
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }]
    }),
    prisma.entry.count({ where })
  ])

  res.json({ entries, pagination: { total, page, limit } })
})

// POST /api/admin/entries/:id/change - direct admin change
const DirectChangeSchema = z.object({
  roomId: z.string().optional(),
  day: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional()
})

router.post('/entries/:id/change', async (req: AuthRequest, res: Response) => {
  const parsed = DirectChangeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } })
    return
  }

  const entry = await prisma.entry.findUnique({ where: { id: req.params.id } })
  if (!entry) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Timetable entry not found.' } })
    return
  }

  const updated = await prisma.entry.update({
    where: { id: req.params.id },
    data: {
      ...(parsed.data.roomId ? { roomId: parsed.data.roomId } : {}),
      ...(parsed.data.day ? { day: parsed.data.day.toUpperCase() } : {}),
      ...(parsed.data.startTime ? { startTime: parsed.data.startTime } : {}),
      ...(parsed.data.endTime ? { endTime: parsed.data.endTime } : {})
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'entry.change',
      entity: 'Entry',
      entityId: entry.id,
      detail: `Direct schedule update: ${parsed.data.reason || 'Admin modification'}`
    }
  })

  res.json({ ok: true, entry: updated })
})

// GET /api/admin/disruptions
router.get('/disruptions', async (_req: Request, res: Response) => {
  const disruptions = await prisma.disruption.findMany({
    include: {
      proposals: { include: { room: true } },
      entry: { include: { group: true } },
      room: true
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json({ disruptions })
})

// POST /api/admin/disruptions
const DisruptionSchema = z.object({
  entryId: z.string().optional(),
  roomId: z.string().optional(),
  type: z.enum(['cancellation', 'room_closure', 'faculty_change']),
  reason: z.string().optional(),
  affectedDay: z.string(),
  startTime: z.string(),
  endTime: z.string()
})

router.post('/disruptions', async (req: AuthRequest, res: Response) => {
  const parsed = DisruptionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } })
    return
  }

  const { entryId, roomId, type, reason, affectedDay, startTime, endTime } = parsed.data
  const dayUpper = affectedDay.toUpperCase()
  const dayNum = DAY_MAP_TO_NUM[dayUpper] || 1

  const disruption = await prisma.disruption.create({
    data: {
      entryId: entryId || null,
      roomId: roomId || null,
      type,
      reason: reason || null,
      affectedDay: dayUpper,
      startTime,
      endTime,
      status: 'open',
      createdBy: req.user!.id
    }
  })

  const allEntries = await prisma.entry.findMany({ where: { is_live: true } })

  const engineEntries: ScheduledEntry[] = allEntries.map(e => ({
    id: e.id,
    roomId: e.roomId,
    facultyId: e.facultyId,
    groupId: e.groupId,
    subject: e.subject || undefined,
    day: DAY_MAP_TO_NUM[e.day] || 1,
    start: e.startTime,
    end: e.endTime,
    entryType: e.entryType
  }))

  const allDisruptions = await prisma.disruption.findMany({ where: { status: 'open' } })

  const engineDisruptions: DisruptionRecord[] = allDisruptions.map(d => ({
    id: d.id,
    roomId: d.roomId,
    day: DAY_MAP_TO_NUM[d.affectedDay] || 1,
    start: d.startTime,
    end: d.endTime,
    status: 'active'
  }))

  const allRooms = await prisma.room.findMany()
  const candidateRooms: CandidateRoom[] = allRooms.map(r => ({
    id: r.id,
    code: r.id,
    blockCode: r.blockId,
    floor: r.floor_num ?? 1,
    type: r.type,
    capacity: r.capacity
  }))

  const allRoomEntries = new Map<string, ScheduledEntry[]>()
  for (const e of engineEntries) {
    if (e.roomId) {
      if (!allRoomEntries.has(e.roomId)) allRoomEntries.set(e.roomId, [])
      allRoomEntries.get(e.roomId)!.push(e)
    }
  }

  const allRoomDisruptions = new Map<string, DisruptionRecord[]>()
  for (const d of engineDisruptions) {
    if (d.roomId) {
      if (!allRoomDisruptions.has(d.roomId)) allRoomDisruptions.set(d.roomId, [])
      allRoomDisruptions.get(d.roomId)!.push(d)
    }
  }

  let affectedEntry: ScheduledEntry | null = null
  let currentCandidateRoom: CandidateRoom | null = null

  if (entryId) {
    const dbEntry = await prisma.entry.findUnique({ where: { id: entryId } })
    if (dbEntry) {
      affectedEntry = {
        id: dbEntry.id,
        roomId: dbEntry.roomId,
        facultyId: dbEntry.facultyId,
        groupId: dbEntry.groupId,
        subject: dbEntry.subject || undefined,
        day: DAY_MAP_TO_NUM[dbEntry.day] || 1,
        start: dbEntry.startTime,
        end: dbEntry.endTime,
        entryType: dbEntry.entryType
      }
    }
  }

  if (!affectedEntry) {
    affectedEntry = {
      id: `disrupted-slot-${disruption.id}`,
      roomId: roomId || null,
      day: dayNum,
      start: startTime,
      end: endTime
    }
  }

  if (affectedEntry.roomId) {
    const r = allRooms.find(rm => rm.id === affectedEntry!.roomId)
    if (r) {
      currentCandidateRoom = {
        id: r.id,
        code: r.id,
        blockCode: r.blockId,
        floor: r.floor_num ?? 1,
        type: r.type,
        capacity: r.capacity
      }
    }
  }

  const facultyEntries = affectedEntry.facultyId
    ? engineEntries.filter(e => e.facultyId === affectedEntry!.facultyId)
    : []

  const groupEntries = affectedEntry.groupId
    ? engineEntries.filter(e => e.groupId === affectedEntry!.groupId)
    : []

  // Real group strength and session type, so the engine's capacity and
  // room-type checks are meaningful rather than always passing.
  const affectedGroup = affectedEntry.groupId
    ? await prisma.group.findUnique({ where: { id: affectedEntry.groupId } })
    : null
  const groupSize = affectedGroup?.size ?? null
  const isLabSession = affectedEntry.entryType === 'lab'

  const repairResult = findRepairOptions({
    affectedEntry,
    currentRoom: currentCandidateRoom,
    candidateRooms,
    groupSize,
    isLabSession,
    allRoomEntries,
    allRoomDisruptions,
    facultyEntries,
    groupEntries
  })

  const savedProposals = []
  for (let i = 0; i < repairResult.options.length; i++) {
    const opt = repairResult.options[i]
    const p = await prisma.proposal.create({
      data: {
        disruptionId: disruption.id,
        roomId: opt.roomId,
        newDay: dayUpper,
        newStartTime: startTime,
        newEndTime: endTime,
        rank: i + 1,
        score: opt.score,
        status: 'pending'
      },
      include: { room: true }
    })
    savedProposals.push(p)
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'disruption.create',
      entity: 'Disruption',
      entityId: disruption.id,
      detail: `Created ${type} disruption on ${dayUpper} ${startTime}-${endTime}. Generated ${savedProposals.length} repair proposals.`
    }
  })

  res.json({
    disruption,
    proposals: savedProposals,
    noSafeOption: repairResult.noSafeOption,
    noticeDraft: repairResult.cancellationNoticeDraft
  })
})

// GET /api/admin/proposals?status=
router.get('/proposals', async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string }
  const proposals = await prisma.proposal.findMany({
    where: status ? { status } : {},
    include: {
      disruption: true,
      room: true
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json({ proposals })
})

// POST /api/admin/proposals/:id/approve
router.post('/proposals/:id/approve', async (req: AuthRequest, res: Response) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: { disruption: true }
  })

  if (!proposal) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Proposal not found.' } })
    return
  }

  if (proposal.status !== 'pending') {
    res.status(409).json({ error: { code: 'NOT_PENDING', message: `Proposal is already ${proposal.status}.` } })
    return
  }

  // Re-run the full hard-constraint set before applying. A proposal can go
  // stale between generation and approval, and checking only that the room is
  // free would let a faculty clash, a group clash, a closed room or a capacity
  // overflow through.
  const disruption = await prisma.disruption.findUnique({ where: { id: proposal.disruptionId } })
  if (!disruption) {
    res.status(409).json({ error: { code: 'STALE_PROPOSAL', message: 'The disruption no longer exists.' } })
    return
  }

  const targetDay = proposal.newDay || disruption.affectedDay
  const targetStart = proposal.newStartTime || disruption.startTime
  const targetEnd = proposal.newEndTime || disruption.endTime
  const targetDayNum = DAY_MAP_TO_NUM[targetDay] || 1

  if (proposal.roomId) {
    const [room, allLive, openDisruptions] = await Promise.all([
      prisma.room.findUnique({ where: { id: proposal.roomId } }),
      prisma.entry.findMany({ where: { is_live: true } }),
      prisma.disruption.findMany({ where: { status: 'open' } })
    ])

    const toEngineEntry = (e: (typeof allLive)[number]): ScheduledEntry => ({
      id: e.id,
      roomId: e.roomId,
      facultyId: e.facultyId,
      groupId: e.groupId,
      subject: e.subject || undefined,
      day: DAY_MAP_TO_NUM[e.day] || 1,
      start: e.startTime,
      end: e.endTime,
      entryType: e.entryType
    })

    const engineEntries = allLive
      .filter(e => e.id !== disruption.entryId)
      .map(toEngineEntry)

    const engineDisruptions: DisruptionRecord[] = openDisruptions
      .filter(d => d.id !== proposal.disruptionId)
      .map(d => ({
        id: d.id,
        roomId: d.roomId,
        day: DAY_MAP_TO_NUM[d.affectedDay] || 1,
        start: d.startTime,
        end: d.endTime,
        status: 'active'
      }))

    const disruptedEntry = disruption.entryId
      ? allLive.find(e => e.id === disruption.entryId)
      : undefined

    const affectedEntry: ScheduledEntry = {
      id: disruptedEntry?.id ?? `disruption-${proposal.disruptionId}`,
      roomId: disruption.roomId,
      facultyId: disruptedEntry?.facultyId ?? null,
      groupId: disruptedEntry?.groupId ?? null,
      subject: disruptedEntry?.subject || undefined,
      day: targetDayNum,
      start: targetStart,
      end: targetEnd,
      entryType: disruptedEntry?.entryType ?? null
    }

    const affectedGroup = affectedEntry.groupId
      ? await prisma.group.findUnique({ where: { id: affectedEntry.groupId } })
      : null

    const candidateRoom: CandidateRoom | null = room
      ? {
        id: room.id,
        code: room.id,
        blockCode: room.blockId,
        floor: room.floor_num ?? 1,
        type: room.type,
        capacity: room.capacity
      }
      : null

    if (!candidateRoom) {
      res.status(409).json({
        error: { code: 'STALE_PROPOSAL', message: 'The proposed room no longer exists.' },
        failedChecks: ['room_exists']
      })
      return
    }

    const { passed, checks } = verifyHardConstraints({
      candidateRoom,
      affectedEntry,
      groupSize: affectedGroup?.size ?? null,
      roomEntries: engineEntries.filter(e => e.roomId === candidateRoom.id),
      roomDisruptions: engineDisruptions.filter(d => d.roomId === candidateRoom.id),
      facultyEntries: affectedEntry.facultyId
        ? engineEntries.filter(e => e.facultyId === affectedEntry.facultyId)
        : [],
      groupEntries: affectedEntry.groupId
        ? engineEntries.filter(e => e.groupId === affectedEntry.groupId)
        : []
    })

    if (!passed) {
      const failedChecks: string[] = checks
        .filter((c: ConstraintCheckResult) => c.status === 'failed')
        .map((c: ConstraintCheckResult) => c.name)

      await prisma.proposal.update({
        where: { id: req.params.id },
        data: { status: 'stale' }
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'proposal.stale',
          entity: 'Proposal',
          entityId: proposal.id,
          detail: `Approval blocked; failed checks: ${failedChecks.join(', ')}`
        }
      })

      res.status(409).json({
        error: {
          code: 'STALE_PROPOSAL',
          message: 'Hard constraint check failed since the proposal was generated.'
        },
        status: 'stale',
        failedChecks,
        checks
      })
      return
    }
  }

  await prisma.proposal.update({
    where: { id: req.params.id },
    data: {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user!.id
    }
  })

  await prisma.proposal.updateMany({
    where: {
      disruptionId: proposal.disruptionId,
      id: { not: req.params.id }
    },
    data: { status: 'rejected' }
  })

  await prisma.disruption.update({
    where: { id: proposal.disruptionId },
    data: { status: 'resolved' }
  })

  if (proposal.disruption.entryId && proposal.roomId) {
    await prisma.entry.update({
      where: { id: proposal.disruption.entryId },
      data: { roomId: proposal.roomId }
    })
  }

  let notifiedCount = 0
  if (proposal.disruption.entryId) {
    const entry = await prisma.entry.findUnique({
      where: { id: proposal.disruption.entryId },
      include: { group: true }
    })
    if (entry?.group?.name) {
      const students = await prisma.user.findMany({ where: { group: entry.group.name } })
      for (const st of students) {
        await prisma.notification.create({
          data: {
            userId: st.id,
            type: 'proposal_approved',
            title: 'Schedule Change Approved',
            body: `Your class on ${targetDay} ${targetStart}-${targetEnd} has been moved to room ${proposal.roomId || 'Online/TBD'}.`
          }
        })
        notifiedCount++
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'proposal.approve',
      entity: 'Proposal',
      entityId: proposal.id,
      detail: `Approved repair option assigning room ${proposal.roomId} on ${targetDay}. Notified ${notifiedCount} students.`
    }
  })

  res.json({ ok: true, approvedProposalId: proposal.id, notifiedStudents: notifiedCount })
})

// POST /api/admin/proposals/:id/reject
router.post('/proposals/:id/reject', async (req: AuthRequest, res: Response) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } })
  if (!proposal) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Proposal not found.' } })
    return
  }

  await prisma.proposal.update({
    where: { id: req.params.id },
    data: { status: 'rejected' }
  })

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'proposal.reject',
      entity: 'Proposal',
      entityId: req.params.id,
      detail: `Rejected proposal ${req.params.id}`
    }
  })

  res.json({ ok: true })
})

// GET /api/admin/audit-log?from=&to=
router.get('/audit-log', async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string }
  const { limit, skip, page } = getPagination(req)

  const where: any = {}
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {})
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ])

  res.json({ logs, pagination: { total, page, limit } })
})

// GET /api/admin/conflicts - detect double-booked rooms or faculty
router.get('/conflicts', async (_req: Request, res: Response) => {
  const live = await prisma.entry.findMany({
    where: { is_live: true },
    include: { room: true, faculty: true, group: true }
  })

  const conflicts: Array<{ type: string; description: string; entries: any[] }> = []

  // Check room conflicts
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]

      if (a.day === b.day) {
        const overlap = !(a.endTime <= b.startTime || a.startTime >= b.endTime)
        if (overlap) {
          if (a.roomId && a.roomId === b.roomId) {
            conflicts.push({
              type: 'ROOM_CLASH',
              description: `Room ${a.roomId} double-booked on ${a.day} ${a.startTime}-${a.endTime}`,
              entries: [a, b]
            })
          }
          if (a.facultyId && a.facultyId === b.facultyId) {
            conflicts.push({
              type: 'FACULTY_CLASH',
              description: `Faculty ${a.faculty?.name} double-booked on ${a.day} ${a.startTime}-${a.endTime}`,
              entries: [a, b]
            })
          }
        }
      }
    }
  }

  res.json({ count: conflicts.length, conflicts })
})

// --- CRUD Endpoints for Academic Entities ---
//
// Body fields are whitelisted per model. Passing req.body straight into Prisma
// would let an admin set relation ids, or trip a 500 on an unknown key.

function pickFields(body: Record<string, unknown>, fields: string[]) {
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    if (body[field] !== undefined) data[field] = body[field]
  }
  return data
}

// Rooms CRUD
const ROOM_FIELDS = ['blockId', 'floorId', 'floor_num', 'type', 'capacity', 'confidence', 'is_mock']

router.get('/rooms', async (_req: Request, res: Response) => {
  const rooms = await prisma.room.findMany({ include: { floor: true } })
  res.json({ rooms })
})

router.post('/rooms', async (req: AuthRequest, res: Response) => {
  const data = pickFields(req.body, ['id', ...ROOM_FIELDS])
  if (!data.id || !data.blockId) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Room id and blockId are required.' } })
    return
  }
  // `confidence` is non-nullable; an admin-created room is authoritative.
  if (!data.confidence) data.confidence = 'confirmed'
  const room = await prisma.room.create({ data: data as Prisma.RoomUncheckedCreateInput })
  res.status(201).json({ room })
})

router.put('/rooms/:id', async (req: AuthRequest, res: Response) => {
  const room = await prisma.room.update({ where: { id: String(req.params.id) }, data: pickFields(req.body, ROOM_FIELDS) })
  res.json({ room })
})

router.delete('/rooms/:id', async (req: AuthRequest, res: Response) => {
  await prisma.room.delete({ where: { id: String(req.params.id) } })
  res.json({ ok: true })
})

// Faculty CRUD
const FACULTY_FIELDS = ['code', 'name', 'departmentId', 'is_mock']

router.get('/faculty', async (_req: Request, res: Response) => {
  const faculty = await prisma.faculty.findMany({ include: { department: true } })
  res.json({ faculty })
})

const FacultyCreateSchema = z.object({
  code: z.string().min(2, 'Faculty code is required'),
  name: z.string().min(2, 'Faculty name is required'),
  departmentId: z.string().optional(),
  is_mock: z.boolean().optional(),
  // Optional login provisioning. When `email` is supplied the faculty member
  // also gets a User account with a temporary password they must rotate.
  email: z.string().email().optional(),
  tempPassword: z.string().min(10, 'Temporary password must be at least 10 characters').optional(),
})

// POST /api/admin/faculty - creates the Faculty record, and when an email is
// supplied also the linked User login (role "faculty", must-change-on-first-login).
router.post('/faculty', async (req: AuthRequest, res: Response) => {
  const parsed = FacultyCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message || 'Invalid faculty payload.' },
    })
    return
  }

  const { email, tempPassword, ...facultyFields } = parsed.data

  if (email) {
    const normalizedEmail = email.toLowerCase().trim()
    const clash = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (clash) {
      res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists.' } })
      return
    }
  }

  const data = pickFields(facultyFields as Record<string, unknown>, FACULTY_FIELDS)

  const result = await prisma.$transaction(async tx => {
    const faculty = await tx.faculty.create({ data: data as { code: string; name: string } })

    let user = null
    if (email) {
      user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          // Default temp password when the admin does not set one; the account
          // is still forced to rotate it on first login.
          password: await bcrypt.hash(tempPassword || `VFSTR@${faculty.code}2026`, 10),
          role: 'faculty',
          name: faculty.name,
          facultyId: faculty.id,
          mustChangePassword: true,
        },
      })
    }

    await tx.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'admin.faculty.create',
        entity: 'Faculty',
        entityId: faculty.id,
        detail: user
          ? `Created faculty ${faculty.code} (${faculty.name}) with login ${user.email}`
          : `Created faculty ${faculty.code} (${faculty.name}) without a login`,
      },
    })

    return { faculty, user }
  })

  res.status(201).json({ faculty: result.faculty, user: result.user })
})

router.put('/faculty/:id', async (req: AuthRequest, res: Response) => {
  const faculty = await prisma.faculty.update({ where: { id: String(req.params.id) }, data: pickFields(req.body, FACULTY_FIELDS) })
  res.json({ faculty })
})

router.delete('/faculty/:id', async (req: AuthRequest, res: Response) => {
  await prisma.faculty.delete({ where: { id: String(req.params.id) } })
  res.json({ ok: true })
})

// Groups CRUD
const GROUP_FIELDS = ['name', 'year', 'departmentId', 'section', 'size']

router.get('/groups-crud', async (_req: Request, res: Response) => {
  const groups = await prisma.group.findMany({ include: { department: true } })
  res.json({ groups })
})

router.post('/groups-crud', async (req: AuthRequest, res: Response) => {
  const data = pickFields(req.body, GROUP_FIELDS)
  if (!data.name || data.year === undefined || !data.departmentId || !data.section) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Group name, year, departmentId and section are required.' } })
    return
  }
  const group = await prisma.group.create({ data: data as { name: string; year: number; departmentId: string; section: string } })
  res.status(201).json({ group })
})

router.put('/groups-crud/:id', async (req: AuthRequest, res: Response) => {
  const group = await prisma.group.update({ where: { id: String(req.params.id) }, data: pickFields(req.body, GROUP_FIELDS) })
  res.json({ group })
})

router.delete('/groups-crud/:id', async (req: AuthRequest, res: Response) => {
  await prisma.group.delete({ where: { id: String(req.params.id) } })
  res.json({ ok: true })
})

// Departments CRUD
const DEPARTMENT_FIELDS = ['code', 'name']

router.get('/departments', async (_req: Request, res: Response) => {
  const departments = await prisma.department.findMany()
  res.json({ departments })
})

router.post('/departments', async (req: AuthRequest, res: Response) => {
  const data = pickFields(req.body, DEPARTMENT_FIELDS)
  if (!data.code || !data.name) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Department code and name are required.' } })
    return
  }
  const department = await prisma.department.create({ data: data as { code: string; name: string } })
  res.status(201).json({ department })
})

router.put('/departments/:id', async (req: AuthRequest, res: Response) => {
  const department = await prisma.department.update({ where: { id: String(req.params.id) }, data: pickFields(req.body, DEPARTMENT_FIELDS) })
  res.json({ department })
})

router.delete('/departments/:id', async (req: AuthRequest, res: Response) => {
  await prisma.department.delete({ where: { id: String(req.params.id) } })
  res.json({ ok: true })
})

// Blocks CRUD
const BLOCK_FIELDS = ['name']

router.get('/blocks-crud', async (_req: Request, res: Response) => {
  const blocks = await prisma.block.findMany({ include: { floors: true } })
  res.json({ blocks })
})

router.post('/blocks-crud', async (req: AuthRequest, res: Response) => {
  const data = pickFields(req.body, ['id', ...BLOCK_FIELDS])
  if (!data.id || !data.name) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Block id and name are required.' } })
    return
  }
  const block = await prisma.block.create({ data: data as { id: string; name: string } })
  res.status(201).json({ block })
})

router.put('/blocks-crud/:id', async (req: AuthRequest, res: Response) => {
  const block = await prisma.block.update({ where: { id: String(req.params.id) }, data: pickFields(req.body, BLOCK_FIELDS) })
  res.json({ block })
})

router.delete('/blocks-crud/:id', async (req: AuthRequest, res: Response) => {
  await prisma.block.delete({ where: { id: String(req.params.id) } })
  res.json({ ok: true })
})


// ---------------------------------------------------------------------------
// Schedule requests (faculty swap / replace) - admin oversight.
// ---------------------------------------------------------------------------

// GET /api/admin/schedule-requests
router.get('/schedule-requests', async (req: Request, res: Response) => {
  const status = req.query.status ? String(req.query.status) : undefined
  const { skip, limit, page } = getPagination(req)

  const where = status ? { status } : {}
  const [requests, total] = await Promise.all([
    prisma.scheduleRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, code: true, name: true } },
        targetFaculty: { select: { id: true, code: true, name: true } },
        sourceEntry: true,
        targetEntry: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.scheduleRequest.count({ where }),
  ])

  res.json({ requests, total, page, limit })
})

const OverrideSchema = z.object({
  decision: z.enum(['accept', 'reject']),
})

// POST /api/admin/schedule-requests/:id/override - admin forces a decision.
router.post('/schedule-requests/:id/override', async (req: AuthRequest, res: Response) => {
  const parsed = OverrideSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Decision must be accept or reject.' } })
    return
  }

  const request = await prisma.scheduleRequest.findUnique({ where: { id: String(req.params.id) } })
  if (!request) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Request not found.' } })
    return
  }
  if (request.status !== 'pending') {
    res.status(409).json({ error: { code: 'ALREADY_DECIDED', message: `This request is already ${request.status}.` } })
    return
  }

  if (parsed.data.decision === 'reject') {
    const rejected = await prisma.scheduleRequest.update({
      where: { id: request.id },
      data: { status: 'rejected', decidedAt: new Date(), decidedBy: req.user!.id },
    })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'admin.schedule_request.override_reject',
        entity: 'ScheduleRequest',
        entityId: request.id,
        detail: `Admin rejected ${request.type} request`,
      },
    })
    res.json({ request: rejected })
    return
  }

  const result = await applyScheduleRequest(request.id, req.user!.id)
  if (!result.ok) {
    res.status(409).json({ error: { code: result.code, message: 'The request could not be applied.' } })
    return
  }
  res.json({ request: result.request })
})

export default router



