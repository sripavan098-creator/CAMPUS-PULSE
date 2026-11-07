import { Router, Response } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { applyScheduleRequest, overlaps } from '../lib/scheduleRequests.js'

const router = Router()
router.use(requireAuth)
router.use(requireRole('faculty', 'admin'))

// GET /api/faculty/me/timetable
router.get('/timetable', async (req: AuthRequest, res: Response) => {
  const facultyId = req.user!.facultyId
  if (!facultyId && req.user!.role !== 'admin') {
    res.status(400).json({ error: 'No faculty record linked to this account' })
    return
  }

  const entries = await prisma.entry.findMany({
    where: {
      ...(facultyId ? { facultyId } : {}),
      is_live: true
    },
    include: {
      room: { select: { id: true, blockId: true, floorId: true } },
      group: true
    },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }]
  })

  res.json({ entries })
})

// GET /api/faculty/me/changes
router.get('/changes', async (req: AuthRequest, res: Response) => {
  const facultyId = req.user!.facultyId

  const disruptions = await prisma.disruption.findMany({
    where: {
      ...(facultyId ? { entry: { facultyId } } : {}),
      status: { in: ['open', 'resolved'] }
    },
    include: {
      entry: true,
      proposals: true
    },
    orderBy: { createdAt: 'desc' }
  })

  res.json({ changes: disruptions })
})


// ---------------------------------------------------------------------------
// Schedule requests: faculty swap and replace.
//
// A swap exchanges two existing periods between two faculty members. A replace
// hands one period to a free faculty member who already teaches the same
// section, so the students keep their room and slot.
// ---------------------------------------------------------------------------

/** The signed-in user's linked Faculty row, or null when the account has none. */
async function currentFaculty(req: AuthRequest) {
  if (!req.user!.facultyId) return null
  return prisma.faculty.findUnique({ where: { id: req.user!.facultyId } })
}

const SwapSchema = z.object({
  sourceEntryId: z.string().min(1, 'sourceEntryId is required'),
  targetEntryId: z.string().min(1, 'targetEntryId is required'),
})

// POST /api/faculty/me/requests/swap
router.post('/requests/swap', async (req: AuthRequest, res: Response) => {
  const parsed = SwapSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message || 'Invalid swap request.' } })
    return
  }

  const me = await currentFaculty(req)
  if (!me) {
    res.status(400).json({ error: { code: 'NO_FACULTY_RECORD', message: 'No faculty record is linked to this account.' } })
    return
  }

  const { sourceEntryId, targetEntryId } = parsed.data
  if (sourceEntryId === targetEntryId) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A period cannot be swapped with itself.' } })
    return
  }

  const [source, target] = await Promise.all([
    prisma.entry.findUnique({ where: { id: sourceEntryId } }),
    prisma.entry.findUnique({ where: { id: targetEntryId } }),
  ])

  if (!source || !target) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'One or both periods do not exist.' } })
    return
  }
  // Each entry must genuinely belong to the faculty the requester names.
  if (source.facultyId !== me.id) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'The source period does not belong to you.' } })
    return
  }
  if (!target.facultyId) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'The target period has no faculty assigned.' } })
    return
  }
  if (target.facultyId === me.id) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Both periods already belong to you.' } })
    return
  }

  // After the swap each faculty member teaches the other's slot. Neither may
  // end up with two overlapping periods on the same day.
  const targetFacultyId = target.facultyId
  const [myOther, theirOther] = await Promise.all([
    prisma.entry.findMany({ where: { facultyId: me.id, is_live: true, id: { notIn: [source.id] } } }),
    prisma.entry.findMany({ where: { facultyId: targetFacultyId, is_live: true, id: { notIn: [target.id] } } }),
  ])

  const myConflict = myOther.find(e => overlaps(e, target))
  if (myConflict) {
    res.status(409).json({
      error: { code: 'SWAP_CONFLICT', message: `You already teach ${myConflict.subject || 'a class'} on ${target.day} at ${target.startTime}.` },
    })
    return
  }
  const theirConflict = theirOther.find(e => overlaps(e, source))
  if (theirConflict) {
    res.status(409).json({
      error: { code: 'SWAP_CONFLICT', message: `The other faculty member already teaches ${theirConflict.subject || 'a class'} on ${source.day} at ${source.startTime}.` },
    })
    return
  }

  const request = await prisma.scheduleRequest.create({
    data: {
      type: 'swap',
      status: 'pending',
      requesterId: me.id,
      targetFacultyId,
      sourceEntryId: source.id,
      targetEntryId: target.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'faculty.swap.request',
      entity: 'ScheduleRequest',
      entityId: request.id,
      detail: `Swap requested: ${source.day} ${source.startTime} <-> ${target.day} ${target.startTime}`,
    },
  })

  res.status(201).json({ request })
})

const ReplaceSchema = z.object({
  sourceEntryId: z.string().min(1, 'sourceEntryId is required'),
  substituteFacultyId: z.string().min(1, 'substituteFacultyId is required'),
  reason: z.string().max(500).optional(),
})

// GET /api/faculty/me/replacement-candidates?entryId=...
// Faculty who teach the same section and are free in that slot.
router.get('/replacement-candidates', async (req: AuthRequest, res: Response) => {
  const me = await currentFaculty(req)
  if (!me) {
    res.status(400).json({ error: { code: 'NO_FACULTY_RECORD', message: 'No faculty record is linked to this account.' } })
    return
  }

  const entryId = String(req.query.entryId || '')
  if (!entryId) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'entryId is required.' } })
    return
  }

  const entry = await prisma.entry.findUnique({ where: { id: entryId } })
  if (!entry) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Period not found.' } })
    return
  }
  if (entry.facultyId !== me.id) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This period does not belong to you.' } })
    return
  }
  if (!entry.groupId) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'This period has no section assigned.' } })
    return
  }

  // Faculty who already teach this section.
  const sameSection = await prisma.entry.findMany({
    where: { groupId: entry.groupId, is_live: true, facultyId: { not: null } },
    select: { facultyId: true },
  })
  const candidateIds = new Set(sameSection.map(e => e.facultyId!).filter(id => id && id !== me.id))

  const candidates = await prisma.faculty.findMany({
    where: { id: { in: [...candidateIds] } },
    select: { id: true, code: true, name: true, departmentId: true },
  })

  // Drop anyone already busy in this slot.
  const busy = await prisma.entry.findMany({
    where: { facultyId: { in: candidates.map(c => c.id) }, is_live: true, day: entry.day },
    select: { facultyId: true, day: true, startTime: true, endTime: true },
  })
  const free = candidates.filter(c => !busy.some(b => b.facultyId === c.id && overlaps(b, entry)))

  res.json({ entry, candidates: free })
})

// GET /api/faculty/me/swap-candidates?entryId=...
// Other faculty members' live periods in the same section, offered as swap
// targets. Same-section periods are the ones a counterpart can realistically
// trade, since the students keep their room and slot.
router.get('/swap-candidates', async (req: AuthRequest, res: Response) => {
  const me = await currentFaculty(req)
  if (!me) {
    res.status(400).json({ error: { code: 'NO_FACULTY_RECORD', message: 'No faculty record is linked to this account.' } })
    return
  }

  const entryId = String(req.query.entryId || '')
  if (!entryId) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'entryId is required.' } })
    return
  }

  const entry = await prisma.entry.findUnique({ where: { id: entryId } })
  if (!entry) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Period not found.' } })
    return
  }
  if (entry.facultyId !== me.id) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This period does not belong to you.' } })
    return
  }

  const entries = await prisma.entry.findMany({
    where: {
      is_live: true,
      groupId: entry.groupId ?? undefined,
      facultyId: { not: null },
      id: { not: entry.id },
      NOT: { facultyId: me.id },
    },
    include: {
      faculty: { select: { id: true, code: true, name: true } },
      room: { select: { id: true, blockId: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    take: 200,
  })

  res.json({ entry, candidates: entries })
})

// POST /api/faculty/me/requests/replace
router.post('/requests/replace', async (req: AuthRequest, res: Response) => {
  const parsed = ReplaceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message || 'Invalid replace request.' } })
    return
  }

  const me = await currentFaculty(req)
  if (!me) {
    res.status(400).json({ error: { code: 'NO_FACULTY_RECORD', message: 'No faculty record is linked to this account.' } })
    return
  }

  const { sourceEntryId, substituteFacultyId, reason } = parsed.data

  const entry = await prisma.entry.findUnique({ where: { id: sourceEntryId } })
  if (!entry) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Period not found.' } })
    return
  }
  if (entry.facultyId !== me.id) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This period does not belong to you.' } })
    return
  }
  if (substituteFacultyId === me.id) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'You cannot replace yourself.' } })
    return
  }

  const substitute = await prisma.faculty.findUnique({ where: { id: substituteFacultyId } })
  if (!substitute) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Substitute faculty not found.' } })
    return
  }

  // The substitute must already teach this section.
  if (entry.groupId) {
    const teachesSection = await prisma.entry.findFirst({
      where: { groupId: entry.groupId, facultyId: substituteFacultyId, is_live: true },
    })
    if (!teachesSection) {
      res.status(400).json({
        error: { code: 'WRONG_SECTION', message: `${substitute.name} does not teach this section.` },
      })
      return
    }
  }

  // The substitute must be free in that slot.
  const substituteBusy = await prisma.entry.findMany({
    where: { facultyId: substituteFacultyId, is_live: true, day: entry.day },
  })
  const clash = substituteBusy.find(e => overlaps(e, entry))
  if (clash) {
    res.status(409).json({
      error: { code: 'REPLACE_CONFLICT', message: `${substitute.name} already teaches ${clash.subject || 'a class'} on ${entry.day} at ${clash.startTime}.` },
    })
    return
  }

  const request = await prisma.scheduleRequest.create({
    data: {
      type: 'replace',
      status: 'pending',
      requesterId: me.id,
      targetFacultyId: substituteFacultyId,
      substituteFacultyId,
      sourceEntryId: entry.id,
      reason: reason || null,
    },
  })

  // Notify the substitute so it shows up in their inbox.
  const substituteUser = await prisma.user.findUnique({ where: { facultyId: substituteFacultyId } })
  if (substituteUser) {
    await prisma.notification.create({
      data: {
        userId: substituteUser.id,
        type: 'change',
        title: 'Replacement request',
        body: `${me.name} asked you to cover ${entry.subject || 'a class'} on ${entry.day} at ${entry.startTime}.`,
      },
    })
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'faculty.replace.request',
      entity: 'ScheduleRequest',
      entityId: request.id,
      detail: `Replace requested: ${entry.day} ${entry.startTime} -> ${substitute.name}`,
    },
  })

  res.status(201).json({ request })
})

// GET /api/faculty/me/requests - requests I raised or must decide on.
router.get('/requests', async (req: AuthRequest, res: Response) => {
  const me = await currentFaculty(req)
  if (!me) {
    res.status(400).json({ error: { code: 'NO_FACULTY_RECORD', message: 'No faculty record is linked to this account.' } })
    return
  }

  const requests = await prisma.scheduleRequest.findMany({
    where: { OR: [{ requesterId: me.id }, { targetFacultyId: me.id }] },
    include: {
      requester: { select: { id: true, code: true, name: true } },
      targetFaculty: { select: { id: true, code: true, name: true } },
      sourceEntry: true,
      targetEntry: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({
    incoming: requests.filter(r => r.targetFacultyId === me.id && r.status === 'pending'),
    outgoing: requests.filter(r => r.requesterId === me.id),
  })
})

const DecisionSchema = z.object({
  decision: z.enum(['accept', 'reject']),
})

// POST /api/faculty/me/requests/:id/accept | /reject
// Only the target faculty member may decide. Admin override lives under /api/admin.
router.post('/requests/:id/:decision', async (req: AuthRequest, res: Response) => {
  const parsed = DecisionSchema.safeParse(req.params)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Decision must be accept or reject.' } })
    return
  }
  const decision = parsed.data.decision

  const me = await currentFaculty(req)
  if (!me) {
    res.status(400).json({ error: { code: 'NO_FACULTY_RECORD', message: 'No faculty record is linked to this account.' } })
    return
  }

  const request = await prisma.scheduleRequest.findUnique({
    where: { id: String(req.params.id) },
    include: { sourceEntry: true, targetEntry: true },
  })
  if (!request) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Request not found.' } })
    return
  }
  if (request.targetFacultyId !== me.id) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only the requested faculty member may decide this.' } })
    return
  }
  if (request.status !== 'pending') {
    res.status(409).json({ error: { code: 'ALREADY_DECIDED', message: `This request is already ${request.status}.` } })
    return
  }

  if (decision === 'reject') {
    const rejected = await prisma.scheduleRequest.update({
      where: { id: request.id },
      data: { status: 'rejected', decidedAt: new Date(), decidedBy: req.user!.id },
    })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'faculty.request.reject',
        entity: 'ScheduleRequest',
        entityId: request.id,
        detail: `${request.type} request rejected`,
      },
    })
    res.json({ request: rejected })
    return
  }

  // Accept: apply the change and re-validate the slot inside one transaction.
  const result = await applyScheduleRequest(request.id, req.user!.id)

  if (!result.ok) {
    if (result.code === 'SWAP_CONFLICT' || result.code === 'REPLACE_CONFLICT') {
      res.status(409).json({ error: { code: result.code, message: 'The slot is no longer free. The request was not applied.' } })
      return
    }
    if (result.code === 'ALREADY_DECIDED') {
      res.status(409).json({ error: { code: result.code, message: 'This request was already decided.' } })
      return
    }
    res.status(400).json({ error: { code: result.code, message: 'The request could not be applied.' } })
    return
  }

  res.json({ request: result.request })
})

export default router

