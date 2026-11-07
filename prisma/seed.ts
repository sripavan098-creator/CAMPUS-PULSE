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
  for (const n of [1, 2, 3, 4]) {
    await prisma.floor.upsert({
      where: { id: `U-${n}` },
      update: {},
      create: { id: `U-${n}`, blockId: 'U', number: n, label: `Floor ${n}` }
    })
  }
  // P Block
  for (const n of [1, 2, 3, 4]) {
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

  // 9. Ingest every department timetable from the compiled dataset. This is the
  // single source of timetable truth: sections are never re-typed by hand,
  // because a hand-made copy drifts from the sheet it claims to mirror.
  const compiledPath = path.join(__dirname, '../server/data/all_compiled_timetables.json')
  if (fs.existsSync(compiledPath)) {
    console.log("Seeding full university timetables from compiled dataset...")
    const rawCompiled = fs.readFileSync(compiledPath, 'utf-8')
    const compiledData = JSON.parse(rawCompiled)

    // Earlier releases shipped a synthetic coverage generator that invented
    // sections and staff for departments whose sheets had not been supplied.
    // Those rows are marked is_mock and are removed here so a redeploy cannot
    // keep serving them next to the real data.
    const purgedEntries = await prisma.entry.deleteMany({ where: { is_mock: true } })
    const purgedFaculty = await prisma.faculty.deleteMany({
      where: { is_mock: true, entries: { none: {} } }
    })
    if (purgedEntries.count || purgedFaculty.count) {
      console.log(`- Purged ${purgedEntries.count} synthetic entries and ${purgedFaculty.count} unused placeholder faculty`)
    }

    // The same generator also created empty section rows that no sheet ever
    // filled. A section with no periods is a dead entry in every dropdown, so
    // remove any group the compiled dataset does not define.
    const compiledGroupNames = new Set(compiledData.groups.map((g: { name: string }) => g.name))
    const allGroups = await prisma.group.findMany({ select: { id: true, name: true } })
    const staleGroupIds = allGroups.filter(g => !compiledGroupNames.has(g.name)).map(g => g.id)
    if (staleGroupIds.length) {
      await prisma.entry.deleteMany({ where: { groupId: { in: staleGroupIds } } })
      const purgedGroups = await prisma.group.deleteMany({ where: { id: { in: staleGroupIds } } })
      console.log(`- Purged ${purgedGroups.count} empty placeholder sections`)
    }

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
      let flrId: string | null = null

      if (rId.startsWith('N-') || rId.startsWith('NB')) {
        blk = 'N'
        const digitMatch = rId.match(/(?:N-|NB)(\d)/)
        if (digitMatch) flrId = `N-${digitMatch[1]}`
      } else if (rId.startsWith('H-') || rId.startsWith('VSF') || rId.startsWith('VTF') || rId.startsWith('VGF') || rId.startsWith('VFF')) {
        blk = 'H'
        if (rId.startsWith('VGF')) flrId = 'H-0'
        else if (rId.startsWith('VFF')) flrId = 'H-1'
        else if (rId.startsWith('VSF')) flrId = 'H-2'
        else if (rId.startsWith('VTF')) flrId = 'H-3'
      } else if (rId.startsWith('U-') || rId.startsWith('AFF') || rId.startsWith('ASF') || rId.startsWith('ATF')) {
        blk = 'U'
        if (rId.startsWith('AFF')) flrId = 'U-1'
        else if (rId.startsWith('ASF')) flrId = 'U-2'
        else if (rId.startsWith('ATF')) flrId = 'U-3'
      } else if (rId.startsWith('P-') || rId.startsWith('VPTF') || rId.startsWith('VPSF') || rId.startsWith('VPFTF')) {
        blk = 'P'
        if (rId.startsWith('VPSF')) flrId = 'P-2'
        else if (rId.startsWith('VPTF')) flrId = 'P-3'
        else if (rId.startsWith('VPFTF')) flrId = 'P-4'
      } else if (rId.startsWith('VBFFTF') || rId.startsWith('VBFFT')) {
        blk = 'A'
        flrId = 'A-5'
      } else if (rId.startsWith('VBFTF')) {
        blk = 'A'
        flrId = 'A-4'
      } else if (rId.startsWith('VBTF') || rId.startsWith('VBT')) {
        blk = 'A'
        flrId = 'A-3'
      } else if (rId.startsWith('VBSF')) {
        blk = 'A'
        flrId = 'A-2'
      } else if (rId.startsWith('VBFF')) {
        blk = 'A'
        flrId = 'A-1'
      }

      await prisma.room.upsert({
        where: { id: rId },
        update: { floorId: flrId },
        create: {
          id: rId,
          blockId: blk,
          floorId: flrId,
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

    // The compiled dataset is the single source of truth for timetables, so each
    // group's rows are replaced wholesale rather than merged. Matching on
    // (group, day, start time) cannot reconcile a period that moved (ECE's 01:30
    // becoming 13:30) and would leave the old row behind.
    const compiledGroupIds = Array.from(groupMap.values())
    await prisma.entry.deleteMany({ where: { groupId: { in: compiledGroupIds } } })

    // Room labels are free text in the workbooks, so a handful do not match a
    // catalogue room ("Sravanthi Seminar Hall [H Block]"). An unknown room is
    // left unset instead of failing the whole seed on a foreign key.
    const knownRoomIds = new Set(
      (await prisma.room.findMany({ select: { id: true } })).map(r => r.id)
    )

    let newEntriesCount = 0
    for (const entry of compiledData.entries) {
      const gId = groupMap.get(entry.group)
      if (!gId) continue

      const rId = entry.room ? entry.room.trim().toUpperCase() : null
      const roomId = rId && rId !== 'MOBILE' && knownRoomIds.has(rId) ? rId : null

      await prisma.entry.create({
        data: {
          sourceFileId: sourceFile.id,
          groupId: gId,
          roomId,
          facultyId: await facultyIdFor(entry.faculty),
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subject: entry.subject ?? null,
          entryType: entry.entryType || 'class',
          is_mock: false,
          is_live: true
        }
      })
      newEntriesCount++
    }
    console.log(`- Ingested ${compiledData.groups.length} university groups, ${newEntriesCount} entries written`)
    console.log(`- Linked ${facultyCount} distinct faculty from source legends`)

    // The demo faculty login must resolve to a teacher who actually appears in
    // the compiled timetables, otherwise its dashboard is empty. Point it at the
    // busiest real teacher and drop the placeholder record.
    const busiest = await prisma.faculty.findFirst({
      where: { entries: { some: {} } },
      orderBy: { entries: { _count: 'desc' } }
    })
    if (busiest) {
      await prisma.user.updateMany({
        where: { role: 'faculty', facultyId: demoFaculty.id },
        data: { facultyId: busiest.id, name: busiest.name }
      })
      await prisma.faculty.deleteMany({ where: { id: demoFaculty.id, entries: { none: {} } } })
      console.log(`- Demo faculty login mapped to ${busiest.name}`)
    }
  }

  // Academic year + semester rows. The admin Academic Year and Semester tabs
  // read these, and their Activate buttons update them, so they must exist in
  // the database rather than only in the SPA's bundled demo constants.
  const academicYears = [
    { id: 'ay-2026-27', yearName: '2026-2027', startDate: '2026-06-01', endDate: '2027-05-31', isActive: true, isArchived: false },
    { id: 'ay-2025-26', yearName: '2025-2026', startDate: '2025-06-01', endDate: '2026-05-31', isActive: false, isArchived: true },
  ]
  for (const y of academicYears) {
    await prisma.academicYear.upsert({ where: { id: y.id }, update: {}, create: y })
  }

  const semesters = [
    { id: 'sem-odd-2026', academicYearId: 'ay-2026-27', semesterNumber: 1, name: 'Semester I (Odd)', type: 'ODD', startDate: '2026-06-01', endDate: '2026-11-30', isActive: false },
    { id: 'sem-even-2026', academicYearId: 'ay-2026-27', semesterNumber: 2, name: 'Semester II (Even)', type: 'EVEN', startDate: '2026-12-01', endDate: '2027-05-31', isActive: true },
  ]
  for (const sem of semesters) {
    await prisma.semester.upsert({ where: { id: sem.id }, update: {}, create: sem })
  }

  console.log(`Database seeded successfully!`)
  console.log(`- 5 Blocks & floors`)
  console.log(`- ${confirmedRooms.length} Confirmed/Inferred Rooms`)
  console.log(`- 3 Demo User accounts created`)

}

main()
  .catch((err) => {
    console.error('Seed error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

