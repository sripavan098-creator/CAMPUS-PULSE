import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  }
})

async function main() {
  console.log('Seeding CampusPulse database...')

  // 1. Campus Blocks
  const blocks = [
    { id: 'A', name: 'Vignan Bhavan' },
    { id: 'H', name: 'H Block' },
    { id: 'U', name: 'Aryabhata Bhavan' },
    { id: 'N', name: 'Nagarjuna Bhavan' },
    { id: 'P', name: 'P Block' },
  ]
  for (const b of blocks) {
    await prisma.block.upsert({ where: { id: b.id }, update: {}, create: b })
  }

  // 2. Floors
  // Nagarjuna Block (N)
  for (const n of [1, 2, 3, 4, 5, 6]) {
    await prisma.floor.upsert({
      where: { id: `N-${n}` },
      update: {},
      create: { id: `N-${n}`, blockId: 'N', number: n, label: `Floor ${n}` }
    })
  }
  // Vignan Bhavan (A)
  for (const n of [1, 2, 3, 4, 5]) {
    await prisma.floor.upsert({
      where: { id: `A-${n}` },
      update: {},
      create: { id: `A-${n}`, blockId: 'A', number: n, label: `Floor ${n}` }
    })
  }
  // H Block
  const hFloors = [
    { n: 0, label: 'Ground Floor' },
    { n: 1, label: 'Floor 1' },
    { n: 2, label: 'Floor 2' },
    { n: 3, label: 'Floor 3' }
  ]
  for (const hf of hFloors) {
    await prisma.floor.upsert({
      where: { id: `H-${hf.n}` },
      update: {},
      create: { id: `H-${hf.n}`, blockId: 'H', number: hf.n, label: hf.label }
    })
  }
  // U Block (Aryabhata)
  for (const n of [1, 2, 4]) {
    await prisma.floor.upsert({
      where: { id: `U-${n}` },
      update: {},
      create: { id: `U-${n}`, blockId: 'U', number: n, label: `Floor ${n}` }
    })
  }
  // P Block
  for (const n of [2, 3, 4]) {
    await prisma.floor.upsert({
      where: { id: `P-${n}` },
      update: {},
      create: { id: `P-${n}`, blockId: 'P', number: n, label: `Floor ${n}` }
    })
  }

  // 3. Rooms - Real room codes from Department Timetables
  const confirmedRooms = [
    // A-Block Floor 1 (VBFF)
    { id: 'VBFF-1', blockId: 'A', floorId: 'A-1', floor_num: 1, confidence: 'confirmed' },
    { id: 'VBFF-2', blockId: 'A', floorId: 'A-1', floor_num: 1, confidence: 'confirmed' },
    { id: 'VBFF-3', blockId: 'A', floorId: 'A-1', floor_num: 1, confidence: 'confirmed' },
    { id: 'VBFF-4', blockId: 'A', floorId: 'A-1', floor_num: 1, confidence: 'confirmed' },
    { id: 'VBFF-5', blockId: 'A', floorId: 'A-1', floor_num: 1, confidence: 'confirmed' },
    // A-Block Floor 2 (VBSF)
    { id: 'VBSF-1', blockId: 'A', floorId: 'A-2', floor_num: 2, confidence: 'confirmed' },
    { id: 'VBSF-2', blockId: 'A', floorId: 'A-2', floor_num: 2, confidence: 'confirmed' },
    { id: 'VBSF-3', blockId: 'A', floorId: 'A-2', floor_num: 2, confidence: 'confirmed' },
    { id: 'VBSF-4', blockId: 'A', floorId: 'A-2', floor_num: 2, confidence: 'confirmed' },
    { id: 'VBSF-5', blockId: 'A', floorId: 'A-2', floor_num: 2, confidence: 'confirmed' },
    // A-Block Floor 3 (VBTF)
    { id: 'VBTF-1', blockId: 'A', floorId: 'A-3', floor_num: 3, confidence: 'confirmed' },
    { id: 'VBTF-3', blockId: 'A', floorId: 'A-3', floor_num: 3, confidence: 'confirmed' },
    { id: 'VBTF-4', blockId: 'A', floorId: 'A-3', floor_num: 3, confidence: 'confirmed' },
    { id: 'VBTF-5', blockId: 'A', floorId: 'A-3', floor_num: 3, confidence: 'confirmed' },
    { id: 'VBTF-6', blockId: 'A', floorId: 'A-3', floor_num: 3, confidence: 'confirmed' },
    { id: 'VBTF-7', blockId: 'A', floorId: 'A-3', floor_num: 3, confidence: 'confirmed' },
    { id: 'VBTF-8', blockId: 'A', floorId: 'A-3', floor_num: 3, confidence: 'confirmed' },
    // A-Block Floor 4 (VBFTF)
    { id: 'VBFTF-1', blockId: 'A', floorId: 'A-4', floor_num: 4, confidence: 'confirmed' },
    { id: 'VBFTF-2', blockId: 'A', floorId: 'A-4', floor_num: 4, confidence: 'confirmed' },
    { id: 'VBFTF-3', blockId: 'A', floorId: 'A-4', floor_num: 4, confidence: 'confirmed' },
    // A-Block Floor 5 (VBFFTF)
    { id: 'VBFFTF-1', blockId: 'A', floorId: 'A-5', floor_num: 5, confidence: 'confirmed' },
    { id: 'VBFFTF-2', blockId: 'A', floorId: 'A-5', floor_num: 5, confidence: 'confirmed' },
    { id: 'VBFFTF-3', blockId: 'A', floorId: 'A-5', floor_num: 5, confidence: 'confirmed' },
    // H-Block Ground (VGF)
    { id: 'VGF-3', blockId: 'H', floorId: 'H-0', floor_num: 0, confidence: 'confirmed' },
    { id: 'VGF-8', blockId: 'H', floorId: 'H-0', floor_num: 0, confidence: 'confirmed' },
    // H-Block Floor 1 (VFF)
    { id: 'VFF-2', blockId: 'H', floorId: 'H-1', floor_num: 1, confidence: 'confirmed' },
    { id: 'VFF-3', blockId: 'H', floorId: 'H-1', floor_num: 1, confidence: 'confirmed' },
    // N-Block confirmed rooms
    ...['215','216','217','218','219','401','402','418','501','502','514A','514B','601','602','604','605','606','607','608','611','612','613','614','615','616','617','618','619'].map(n => ({
      id: `N-${n}`,
      blockId: 'N',
      floorId: n.length >= 3 ? `N-${n[0]}` : null,
      floor_num: n.length >= 3 ? parseInt(n[0]) : null,
      confidence: 'confirmed'
    })),
    // P-Block inferred
    { id: 'VPSF-1', blockId: 'P', floorId: 'P-2', floor_num: 2, confidence: 'inferred' },
    { id: 'VPSF-2', blockId: 'P', floorId: 'P-2', floor_num: 2, confidence: 'inferred' },
    { id: 'VPSF-5', blockId: 'P', floorId: 'P-2', floor_num: 2, confidence: 'inferred' },
    { id: 'VPTF-7', blockId: 'P', floorId: 'P-3', floor_num: 3, confidence: 'inferred' },
    { id: 'VPTF-9', blockId: 'P', floorId: 'P-3', floor_num: 3, confidence: 'inferred' },
    { id: 'VPTF-10', blockId: 'P', floorId: 'P-3', floor_num: 3, confidence: 'inferred' },
    { id: 'VPTF-11', blockId: 'P', floorId: 'P-3', floor_num: 3, confidence: 'inferred' },
    { id: 'VPTF-12', blockId: 'P', floorId: 'P-3', floor_num: 3, confidence: 'inferred' },
  ]

  // Room type and capacity. The repair engine's type and capacity checks only
  // bite if these are real, so the rooms that carry lab/seminar sessions in the
  // demo timetable are classified explicitly and everything else defaults to a
  // standard classroom.
  const LAB_ROOMS = new Set(['N-617', 'N-618'])
  const SEMINAR_ROOMS = new Set(['N-514A', 'N-514B'])

  function roomProfile(id: string): { type: string; capacity: number } {
    if (LAB_ROOMS.has(id)) return { type: 'Laboratory', capacity: 60 }
    if (SEMINAR_ROOMS.has(id)) return { type: 'Seminar', capacity: 45 }
    return { type: 'Classroom', capacity: 60 }
  }

  for (const r of confirmedRooms) {
    const profile = roomProfile(r.id)
    await prisma.room.upsert({
      where: { id: r.id },
      update: profile,
      create: { ...r, ...profile }
    })
  }

  // 4. Department: ACSE
  const acse = await prisma.department.upsert({
    where: { code: 'ACSE' },
    update: {},
    create: { code: 'ACSE', name: 'Advanced Computer Science and Engineering' }
  })

  // 5. Group: II AIML-J (Official demo section)
  const group = await prisma.group.upsert({
    where: { name: 'II AIML-J' },
    update: { size: 60 },
    create: { name: 'II AIML-J', year: 2, section: 'J', size: 60, departmentId: acse.id }
  })

  // 6. Demo Faculty
  const demoFaculty = await prisma.faculty.upsert({
    where: { code: 'ACSE-FAC-01' },
    update: {},
    create: {
      code: 'ACSE-FAC-01',
      name: 'Dr. K. Jnaneswar',
      departmentId: acse.id,
      is_mock: false
    }
  })

  // 7. Demo Accounts. Passwords must come from the environment; there is no
  // fallback literal, so a misconfigured deployment fails loudly instead of
  // shipping a known password.
  const requireEnv = (name: string): string => {
    const value = process.env[name]
    if (!value || value === '<set-in-env>') {
      throw new Error(
        `${name} is required. Set ADMIN_SEED_PASSWORD, FACULTY_SEED_PASSWORD and STUDENT_SEED_PASSWORD before seeding.`
      )
    }
    return value
  }

  const adminPass = await bcrypt.hash(requireEnv('ADMIN_SEED_PASSWORD'), 10)
  const facultyPass = await bcrypt.hash(requireEnv('FACULTY_SEED_PASSWORD'), 10)
  const studentPass = await bcrypt.hash(requireEnv('STUDENT_SEED_PASSWORD'), 10)

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_SEED_EMAIL || 'admin@vignan.ac.in' },
    update: {},
    create: {
      email: process.env.ADMIN_SEED_EMAIL || 'admin@vignan.ac.in',
      password: adminPass,
      role: 'admin',
      name: 'Administrator (HOD)',
      is_demo: true
    }
  })

  await prisma.user.upsert({
    where: { email: process.env.FACULTY_SEED_EMAIL || 'faculty@vignan.ac.in' },
    update: { facultyId: demoFaculty.id },
    create: {
      email: process.env.FACULTY_SEED_EMAIL || 'faculty@vignan.ac.in',
      password: facultyPass,
      role: 'faculty',
      name: 'Dr. K. Jnaneswar',
      facultyId: demoFaculty.id,
      is_demo: true
    }
  })

  await prisma.user.upsert({
    where: { email: process.env.STUDENT_SEED_EMAIL || 'student@vignan.ac.in' },
    update: {},
    create: {
      email: process.env.STUDENT_SEED_EMAIL || 'student@vignan.ac.in',
      password: studentPass,
      role: 'student',
      name: 'Pavan (Student Representative)',
      group: 'II AIML-J',
      is_demo: true
    }
  })

  // 8. Timetable Source File Record
  const sourceFile = await prisma.sourceFile.upsert({
    where: { sha256: 'acse-timetable-v7-wef-17-08-2026' },
    update: {},
    create: {
      filename: 'ACSE_timetable_V7_w.e.f_17.08.2026.pdf',
      sha256: 'acse-timetable-v7-wef-17-08-2026',
      status: 'committed',
      committedAt: new Date('2026-08-17'),
      report: JSON.stringify({
        department: 'ACSE',
        effectiveDate: '17-08-2026',
        section: 'II AIML-J',
        confirmedRoomRows: 22,
        notes: 'Room allocations extracted directly from department timetable'
      })
    }
  })

  // 9. Periods
  const periods = [
    { p: 1, start: '08:15', end: '09:05' },
    { p: 2, start: '09:05', end: '09:55' },
    // Break 09:55 - 10:05
    { p: 3, start: '10:05', end: '10:55' },
    { p: 4, start: '10:55', end: '11:45' },
    // Break 11:45 - 11:55
    { p: 5, start: '11:55', end: '12:45' },
    { p: 6, start: '12:45', end: '13:35' },
    // Lunch 13:35 - 14:25
    { p: 7, start: '14:25', end: '15:15' },
    { p: 8, start: '15:15', end: '16:05' },
    { p: 9, start: '16:05', end: '16:55' },
  ]

  // 10. Official Real II AIML-J Timetable Entries (w.e.f. 17-08-2026)
  const existingEntriesCount = await prisma.entry.count({ where: { groupId: group.id } })

  const realAssignments: Array<{ day: string; pIdx: number; room: string; subject: string; type: string }> = [
    // MON: N-217, LAB-1(Library), N-617, N-617
    { day: 'MON', pIdx: 0, room: 'N-217', subject: 'Data Structures & Algorithms', type: 'class' },
    { day: 'MON', pIdx: 2, room: 'N-617', subject: 'Operating Systems', type: 'class' },
    { day: 'MON', pIdx: 6, room: 'N-617', subject: 'Machine Learning Lab', type: 'lab' },
    { day: 'MON', pIdx: 7, room: 'N-617', subject: 'Machine Learning Lab', type: 'lab' },

    // TUE: N-607, N-514B, N-615
    { day: 'TUE', pIdx: 0, room: 'N-607', subject: 'Database Management Systems', type: 'class' },
    { day: 'TUE', pIdx: 3, room: 'N-514B', subject: 'Discrete Mathematics', type: 'class' },
    { day: 'TUE', pIdx: 7, room: 'N-615', subject: 'Design & Analysis of Algorithms', type: 'class' },

    // WED: N-217, N-606, N-611, N-611, N-615
    { day: 'WED', pIdx: 0, room: 'N-217', subject: 'Data Structures & Algorithms', type: 'class' },
    { day: 'WED', pIdx: 2, room: 'N-606', subject: 'Operating Systems', type: 'class' },
    { day: 'WED', pIdx: 3, room: 'N-611', subject: 'AI Foundations', type: 'class' },
    { day: 'WED', pIdx: 4, room: 'N-611', subject: 'AI Foundations', type: 'class' },
    { day: 'WED', pIdx: 7, room: 'N-615', subject: 'Design & Analysis of Algorithms', type: 'class' },

    // THU: N-617, LAB-1(LIB), N-617
    { day: 'THU', pIdx: 0, room: 'N-617', subject: 'Database Management Systems', type: 'class' },
    { day: 'THU', pIdx: 7, room: 'N-617', subject: 'Operating Systems Lab', type: 'lab' },

    // FRI: N-215, N-607, N-607, N-617
    { day: 'FRI', pIdx: 0, room: 'N-215', subject: 'Discrete Mathematics', type: 'class' },
    { day: 'FRI', pIdx: 2, room: 'N-607', subject: 'Database Management Systems', type: 'class' },
    { day: 'FRI', pIdx: 3, room: 'N-607', subject: 'AI Foundations', type: 'class' },
    { day: 'FRI', pIdx: 6, room: 'N-617', subject: 'Seminar / Presentation', type: 'class' },

    // SAT: N-618, N-618, N-217, N-217, N-606
    { day: 'SAT', pIdx: 0, room: 'N-618', subject: 'Advanced Python for AI', type: 'lab' },
    { day: 'SAT', pIdx: 1, room: 'N-618', subject: 'Advanced Python for AI', type: 'lab' },
    { day: 'SAT', pIdx: 2, room: 'N-217', subject: 'Data Structures & Algorithms', type: 'class' },
    { day: 'SAT', pIdx: 3, room: 'N-217', subject: 'Design & Analysis of Algorithms', type: 'class' },
    { day: 'SAT', pIdx: 4, room: 'N-606', subject: 'Mentorship & Review', type: 'class' },
  ]

  if (existingEntriesCount === 0) {
    for (const item of realAssignments) {
      const p = periods[item.pIdx]
      await prisma.entry.create({
        data: {
          sourceFileId: sourceFile.id,
          groupId: group.id,
          roomId: item.room,
          facultyId: demoFaculty.id,
          day: item.day,
          startTime: p.start,
          endTime: p.end,
          subject: item.subject,
          entryType: item.type,
          is_mock: false,
          is_live: true
        }
      })
    }

    // Library non-room slots (from II AIML-J sheet)
    await prisma.entry.create({
      data: {
        sourceFileId: sourceFile.id,
        groupId: group.id,
        roomId: null,
        day: 'MON',
        startTime: periods[2].start,
        endTime: periods[2].end,
        subject: 'Central Library Reference Slot (LAB-1)',
        entryType: 'library',
        is_mock: false,
        is_live: true
      }
    })
    await prisma.entry.create({
      data: {
        sourceFileId: sourceFile.id,
        groupId: group.id,
        roomId: null,
        day: 'THU',
        startTime: periods[2].start,
        endTime: periods[2].end,
        subject: 'Central Library Slot (LAB-1 LIB)',
        entryType: 'library',
        is_mock: false,
        is_live: true
      }
    })
  } else {
    console.log("- Skipping timetable entries re-insert: entries already exist.")
  }

  // 11. Ingest Full University Department Timetables (ECE, CSE 3rd Year, SASH, Bioinformatics)
  const compiledPath = path.join(__dirname, '../server/data/all_compiled_timetables.json')
  if (fs.existsSync(compiledPath)) {
    console.log("Seeding full university timetables from compiled dataset...")
    const rawCompiled = fs.readFileSync(compiledPath, 'utf-8')
    const compiledData = JSON.parse(rawCompiled)

    // 11.1 Upsert Departments
    const deptMap = new Map<string, string>()
    deptMap.set('ACSE', acse.id)
    for (const d of compiledData.departments) {
      const rec = await prisma.department.upsert({
        where: { code: d.code },
        update: { name: d.name },
        create: { code: d.code, name: d.name }
      })
      deptMap.set(d.code, rec.id)
    }

    // 11.2 Upsert Rooms from compiledData
    for (const rawRoom of compiledData.rooms) {
      if (!rawRoom || rawRoom === 'MOBILE') continue
      const rId = rawRoom.trim().toUpperCase()
      let blk = 'A'
      if (rId.startsWith('N-') || rId.startsWith('NB')) blk = 'N'
      else if (rId.startsWith('H-') || rId.startsWith('VSF') || rId.startsWith('VTF') || rId.startsWith('VGF') || rId.startsWith('VFF')) blk = 'H'
      else if (rId.startsWith('U-')) blk = 'U'
      else if (rId.startsWith('P-') || rId.startsWith('VPTF') || rId.startsWith('VPSF')) blk = 'P'

      await prisma.room.upsert({
        where: { id: rId },
        update: {},
        create: {
          id: rId,
          blockId: blk,
          confidence: 'confirmed',
          type: rId.includes('LAB') ? 'Laboratory' : 'Classroom',
          capacity: 60
        }
      })
    }

    // 11.3 Upsert Groups
    const groupMap = new Map<string, string>()
    groupMap.set('II AIML-J', group.id)
    for (const g of compiledData.groups) {
      const dId = deptMap.get(g.departmentCode) || acse.id
      const rec = await prisma.group.upsert({
        where: { name: g.name },
        update: { year: g.year, section: g.section, departmentId: dId, size: 60 },
        create: { name: g.name, year: g.year, section: g.section, departmentId: dId, size: 60 }
      })
      groupMap.set(g.name, rec.id)
    }

    // 11.4 Upsert Entries. Runs as an update-or-insert so a redeploy over an
    // already-populated database still backfills faculty/room/subject instead
    // of skipping every existing row.
    // Faculty names from the source legend are free text and may list several
    // people per slot; the first name is used as the primary instructor and
    // generic labels like "CSE Faculty (CN)" stay unlinked.
    const facultyIdByName = new Map<string, string>()
    let facultyCount = 0
    const facultyIdFor = async (raw: string | null | undefined): Promise<string | null> => {
      if (!raw) return null
      const primary = raw.split(/[,;]/)[0].replace(/\s+/g, ' ').trim().replace(/[.]+$/, '')
      if (!primary || /faculty/i.test(primary) || primary.length < 4) return null
      const cached = facultyIdByName.get(primary)
      if (cached) return cached
      const code = `fac-${primary.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}`
      const rec = await prisma.faculty.upsert({
        where: { code },
        update: { name: primary },
        create: { code, name: primary }
      })
      facultyIdByName.set(primary, rec.id)
      facultyCount++
      return rec.id
    }

    let newEntriesCount = 0
    let updatedEntriesCount = 0
    for (const entry of compiledData.entries) {
      const gId = groupMap.get(entry.group)
      if (!gId) continue

      const rId = entry.room ? entry.room.trim().toUpperCase() : null
      const roomId = rId && rId !== 'MOBILE' ? rId : null
      const facultyId = await facultyIdFor(entry.faculty)
      const subject = entry.subject ?? null

      const existing = await prisma.entry.findFirst({
        where: { groupId: gId, day: entry.day, startTime: entry.startTime },
        select: { id: true, facultyId: true, roomId: true, subject: true }
      })

      if (!existing) {
        await prisma.entry.create({
          data: {
            sourceFileId: sourceFile.id,
            groupId: gId,
            roomId,
            facultyId,
            day: entry.day,
            startTime: entry.startTime,
            endTime: entry.endTime,
            subject,
            entryType: entry.entryType || 'class',
            is_mock: false,
            is_live: true
          }
        })
        newEntriesCount++
      } else {
        // Subject and faculty are derived from the workbook and are safe to
        // refresh. Rooms are deliberately left alone: the curated demo rows
        // carry hand-assigned rooms that the raw grid data must not clobber.
        const patch: { facultyId?: string; subject?: string } = {}
        if (facultyId && existing.facultyId !== facultyId) patch.facultyId = facultyId
        if (subject && existing.subject !== subject) patch.subject = subject
        if (Object.keys(patch).length > 0) {
          await prisma.entry.update({ where: { id: existing.id }, data: patch })
          updatedEntriesCount++
        }
      }
    }
    console.log(`- Ingested ${compiledData.groups.length} university groups, ${newEntriesCount} new and ${updatedEntriesCount} refreshed entries`)
    console.log(`- Linked ${facultyCount} distinct faculty from source legends`)
  }

  console.log(`Database seeded successfully!`)
  console.log(`- 5 Blocks & floors`)
  console.log(`- ${confirmedRooms.length} Confirmed/Inferred Rooms`)
  console.log(`- Demo Section: II AIML-J (${realAssignments.length + 2} real entries, is_mock: false)`)
  console.log(`- 3 Demo User accounts created`)

  // Synthetic coverage for the sections whose sheets have not been supplied yet.
  // Opt out with SEED_SYNTHETIC_SECTIONS=false.
  if (process.env.SEED_SYNTHETIC_SECTIONS !== 'false') {
    const { seedDemoSections } = await import('./seedDemoSections')
    await seedDemoSections(prisma)
  }
}

main()
  .catch((err) => {
    console.error('Seed error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

