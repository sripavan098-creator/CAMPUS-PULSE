import { prisma } from './prisma.js'

/**
 * Applies an accepted swap or replace request to the live timetable inside a
 * single transaction. Both the faculty decision route and the admin override
 * call this, so the conflict rules only live in one place.
 */
export function overlaps(
  a: { day: string; startTime: string; endTime: string },
  b: { day: string; startTime: string; endTime: string }
): boolean {
  if (a.day !== b.day) return false
  const mins = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  return mins(a.startTime) < mins(b.endTime) && mins(a.endTime) > mins(b.startTime)
}

export type ApplyResult =
  | { ok: true; request: Awaited<ReturnType<typeof prisma.scheduleRequest.update>> }
  | { ok: false; code: string }

export async function applyScheduleRequest(
  requestId: string,
  decidedByUserId: string
): Promise<ApplyResult> {
  try {
    const request = await prisma.$transaction(async tx => {
      const record = await tx.scheduleRequest.findUnique({
        where: { id: requestId },
        include: { sourceEntry: true, targetEntry: true },
      })
      if (!record) throw new Error('NOT_FOUND')
      if (record.status !== 'pending') throw new Error('ALREADY_DECIDED')

      const source = record.sourceEntry
      const target = record.targetEntry

      if (record.type === 'swap') {
        if (!target || !record.targetFacultyId) throw new Error('SWAP_TARGET_MISSING')

        const requesterOther = await tx.entry.findMany({
          where: { facultyId: record.requesterId, is_live: true, id: { notIn: [source.id] } },
        })
        if (requesterOther.some(e => overlaps(e, target))) throw new Error('SWAP_CONFLICT')

        const targetOther = await tx.entry.findMany({
          where: { facultyId: record.targetFacultyId, is_live: true, id: { notIn: [target.id] } },
        })
        if (targetOther.some(e => overlaps(e, source))) throw new Error('SWAP_CONFLICT')

        await tx.entry.update({ where: { id: source.id }, data: { facultyId: record.targetFacultyId } })
        await tx.entry.update({ where: { id: target.id }, data: { facultyId: record.requesterId } })
      } else {
        if (!record.substituteFacultyId) throw new Error('REPLACE_SUBSTITUTE_MISSING')

        const substituteBusy = await tx.entry.findMany({
          where: { facultyId: record.substituteFacultyId, is_live: true, day: source.day },
        })
        if (substituteBusy.some(e => e.id !== source.id && overlaps(e, source))) throw new Error('REPLACE_CONFLICT')

        await tx.entry.update({ where: { id: source.id }, data: { facultyId: record.substituteFacultyId } })
      }

      const updated = await tx.scheduleRequest.update({
        where: { id: record.id },
        data: { status: 'accepted', decidedAt: new Date(), decidedBy: decidedByUserId },
      })

      await tx.auditLog.create({
        data: {
          userId: decidedByUserId,
          action: `schedule_request.${record.type}.accept`,
          entity: 'ScheduleRequest',
          entityId: record.id,
          detail: `${record.type} request accepted`,
        },
      })

      return updated
    })

    return { ok: true, request }
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN'
    return { ok: false, code }
  }
}
