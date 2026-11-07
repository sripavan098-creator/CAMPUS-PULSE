'use strict';

/**
 * Compile every department timetable workbook into one dataset.
 *
 * Sources (all supplied by the departments; nothing here is invented):
 *   parsed_acse.json                    ACSE, already extracted from the sheet
 *   ece_timetables.txt                  ECE II year, six sections
 *   raw_workbooks/cse_3rd_year.xlsx     CSE III year, 22 sections
 *   raw_workbooks/sash_division_4.xlsx  SASH I year, division 4 sections
 *   raw_workbooks/biotechnology.xlsx    BT, years II-IV + M.Tech
 *   raw_workbooks/bioinformatics.xlsx   Bioinformatics, years II-IV
 *   raw_workbooks/master_rooms_and_timetables.xlsx  room catalogue
 *
 * Every entry records the faculty name exactly as the source prints it. Where a
 * source gives no name the faculty stays null rather than being filled with a
 * placeholder, so the UI can honestly show "Faculty" instead of a fake person.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const {
  parseTimeRange,
  toDay,
  isNoise,
  splitSubjectFaculty,
  cleanFacultyName
} = require('./lib/parseHelpers.cjs');
const { loadMaster, sheetsOf } = require('./lib/masterDump.cjs');
const { parseStreamSheet, sectionLabel, branchToDepartment } = require('./lib/streamParser.cjs');

const rawDir = path.join(__dirname, '../server/data/raw_workbooks');
const dataDir = path.join(__dirname, '../server/data');

const X_STREAM_FILE = '5008ed3b-V3_Updated-2026_X_Stream_I_B.Tech_I_Sem__w.e.f_13.08.26.xlsx';
const Y_STREAM_FILE = 'b2f20592-V3_Updated-2026_Y_Stream_I_B.Tech_I_Sem__w.e.f_13.08.26.xlsx';
const DIV4_FILE = 'dbe3ca65-Master_TT_Division_4-w.e.f_22.10.26_12_.xlsx';
const master = loadMaster(rawDir);

const DEPARTMENTS = [
  { id: 'dept-acse', code: 'ACSE', name: 'Department of Advanced Computer Science and Engineering' },
  { id: 'dept-ece', code: 'ECE', name: 'Department of Electronics and Communication Engineering' },
  { id: 'dept-cse', code: 'CSE', name: 'Department of Computer Science and Engineering' },
  { id: 'dept-sash', code: 'SASH', name: 'School of Applied Science & Humanities' },
  { id: 'dept-bi', code: 'BIOINFO', name: 'Department of Bioinformatics' },
  { id: 'dept-bt', code: 'BT', name: 'Department of Biotechnology' },
  { id: 'dept-aiml', code: 'AIML', name: 'Artificial Intelligence & Machine Learning' },
  { id: 'dept-eee', code: 'EEE', name: 'Electrical and Electronics Engineering' },
  { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering' },
  { id: 'dept-civil', code: 'CIVIL', name: 'Civil Engineering' },
  { id: 'dept-it', code: 'IT', name: 'Information Technology' }
];

const groups = [];
const groupNames = new Set();
const rooms = new Set();
const entries = [];

function addGroup(name, year, departmentCode, section) {
  if (groupNames.has(name)) return;
  groupNames.add(name);
  groups.push({
    id: `group-${departmentCode.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name, year, departmentCode, section, size: 60
  });
}

function addEntry(group, day, startTime, endTime, subject, room, faculty, entryType) {
  if (!group || !day || !startTime || !endTime || !subject) return;
  entries.push({
    group, day, startTime, endTime,
    subject: String(subject).trim(),
    room: room ? String(room).trim() : null,
    faculty: cleanFacultyName(faculty),
    entryType: entryType || 'class'
  });
  if (room) rooms.add(String(room).trim().toUpperCase());
}

function inferType(subject, columnCode) {
  const s = String(subject || '').toUpperCase();
  const c = String(columnCode || '').toUpperCase();
  if (c.includes('-P') || /\(P\)|\bLAB\b|PRACTICAL/.test(s)) return 'lab';
  if (/TRAINING/.test(s)) return 'training';
  if (/\bLIB(RARY)?\b/.test(s)) return 'library';
  return 'class';
}

/**
 * Build a subject -> faculty map from the legend block below the grid.
 *
 * Column positions vary between sheets (BT puts "Faculty (L)" in column 4 and
 * the lab teacher in column 8; Bioinformatics III prefixes a Sl.No. column), so
 * the label and faculty columns are detected from the header row rather than
 * hard-coded. Each legend row is indexed under its full name, its bracketed
 * short form, its module prefix and its course code, so whichever style the grid
 * uses for a cell resolves to the same teacher.
 */
function readLegend(grid, stopPattern) {
  const map = {};
  const pairs = [];
  const put = (key, name) => {
    const k = String(key || '').trim().toUpperCase();
    if (k && name && !map[k]) map[k] = name;
  };

  for (let r = 0; r < grid.length; r++) {
    const header = grid[r] || [];
    const labelCol = header.findIndex(c => /^Subject/i.test(String(c || '').trim()));
    if (labelCol === -1) continue;

    const facultyCols = header
      .map((c, i) => ({ i, t: String(c || '').trim() }))
      .filter(x => /^Faculty/i.test(x.t))
      .sort((a, b) => (/\(L\)/i.test(a.t) ? -1 : 0) - (/\(L\)/i.test(b.t) ? -1 : 0))
      .map(x => x.i);
    const codeCol = header.findIndex(c => /^Code$/i.test(String(c || '').trim()));

    for (let rr = r + 1; rr < grid.length; rr++) {
      const fr = grid[rr] || [];
      const label = String(fr[labelCol] || '').trim();
      if (!label || stopPattern.test(label)) break;

      let name = null;
      for (const col of facultyCols) {
        name = cleanFacultyName(fr[col]);
        if (name) break;
      }
      if (!name) continue;
      pairs.push({ label, name });

      put(label, name);                          // full name
      put(label.split(/\s*[(/]/)[0], name);      // "Bioprocess Engineering"
      put(label.split(':')[0], name);            // "DE-1"
      if (codeCol !== -1) put(fr[codeCol], name);
      for (const p of label.match(/\(([^)]+)\)/g) || []) {
        const inner = p.slice(1, -1).trim();
        if (/^[A-Za-z0-9&/ .-]{2,12}$/.test(inner)) put(inner, name);
      }
    }
    break;
  }
  return { map, pairs };
}

/**
 * Derive acronyms for a legend subject name.
 *
 * Laboratory sheets write the grid cell as an acronym of the legend's full
 * subject name ("PROCESS PRINCIPLES AND CALCULATIONS" -> PPC). Several rules are
 * needed because the sheets are inconsistent about joining words; the caller
 * only accepts a match when exactly one legend entry produces the grid code, so
 * an ambiguous code stays unmatched rather than being attached to the wrong
 * teacher.
 */
function acronymsOf(label) {
  const words = String(label)
    .replace(/\s*\([^)]*\)/g, '')
    .split(/[\s&]+/)
    .filter(Boolean)
    .map(w => w.replace(/[^A-Za-z]/g, '').toUpperCase())
    .filter(Boolean);
  const initials = (skip) => words.filter(w => !skip.has(w)).map(w => w[0]).join('');
  const withAnd = initials(new Set());
  const withoutAnd = initials(new Set(['AND', 'THE']));
  const noOf = initials(new Set(['AND', 'THE', 'OF']));
  return new Set([withAnd, withoutAnd, noOf]);
}

/** Attach a teacher to a grid code when the acronym match is unambiguous. */
function resolveByAcronym(code, legends) {
  const key = String(code || '').toUpperCase();
  if (!key) return null;
  const hits = legends.filter(l => acronymsOf(l.label).has(key));
  return hits.length === 1 ? hits[0].name : null;
}

/** Find the time-header row and the column -> [start,end] map. */
function findTimeColumns(grid, scanRows) {
  for (let r = 0; r < Math.min(scanRows, grid.length); r++) {
    const found = {};
    (grid[r] || []).forEach((cell, idx) => {
      const range = parseTimeRange(cell);
      if (range) found[idx] = range;
    });
    if (Object.keys(found).length >= 5) return { headerRow: r, colTimes: found };
  }
  return { headerRow: -1, colTimes: {} };
}

/** Find the "Room No: X" declaration in a sheet header. */
function findRoom(grid, scanRows) {
  for (let r = 0; r < Math.min(scanRows, grid.length); r++) {
    for (const cell of grid[r] || []) {
      const m = String(cell || '').match(/Room No[.:\s]*([A-Za-z0-9\s-]+)/i);
      if (m) return m[1].trim().toUpperCase().replace(/\s+/g, '-');
    }
  }
  return null;
}

// ---------------------------------------------------------------- rooms ----
try {
  const wb = XLSX.readFile(path.join(rawDir, 'master_rooms_and_timetables.xlsx'));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Rooms']);
  for (const r of rows) {
    String(r['Room code(s) in timetables'] || '')
      .split('|')
      .map(c => c.trim().toUpperCase())
      .filter(c => c && c !== 'MOBILE' && c.length < 30)
      .forEach(c => rooms.add(c));
  }
  console.log(`Rooms: ${rooms.size} from master catalogue`);
} catch (e) {
  console.error('Rooms: master workbook unavailable -', e.message);
}

// ----------------------------------------------------------------- ACSE ----
try {
  const acse = JSON.parse(fs.readFileSync(path.join(dataDir, 'parsed_acse.json'), 'utf-8'));
  for (const g of acse.groups) addGroup(g.name, g.year, 'ACSE', g.section || g.name);
  for (const e of acse.entries) {
    addEntry(e.group, e.day, e.startTime, e.endTime, e.subject, e.room, e.faculty, e.entryType);
  }
  console.log(`ACSE: ${acse.groups.length} groups, ${acse.entries.length} entries`);
} catch (e) {
  console.error('ACSE: parse failed -', e.message);
}

// ------------------------------------------------------------------ ECE ----
try {
  const text = fs.readFileSync(path.join(dataDir, 'ece_timetables.txt'), 'utf-8');
  let section = null;
  let room = null;
  let count = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const sec = line.match(/^(SEC-[A-Z0-9]+)\s*\|\s*ROOM NO:\s*([A-Za-z0-9\s-]+)/);
    if (sec) {
      section = sec[1].trim();
      room = sec[2].trim().replace(/\s+/g, '');
      addGroup(`II ECE ${section}`, 2, 'ECE', section);
      if (room) rooms.add(room.toUpperCase());
      continue;
    }

    const dayMatch = line.match(/^(MON|TUE|WED|THU|FRI|SAT):\s*(.*)$/);
    if (!dayMatch || !section) continue;
    const day = dayMatch[1];

    for (const slot of dayMatch[2].split(/,\s*/)) {
      const m = slot.match(/^(\d{1,2}[.:]\d{2})\s*-\s*(\d{1,2}[.:]\d{2})\s+(.+)$/);
      if (!m) continue;
      const range = parseTimeRange(`${m[1]}-${m[2]}`);
      if (!range) continue;

      let activity = m[3].trim();
      if (isNoise(activity)) continue;

      const parts = activity.split('-');
      let typeCode = null;
      let slotRoom = room;
      const tail = parts[parts.length - 1];
      if (tail && /^(VSF|VTF|VBSF|VBTF|VBFF|VBFTF|VBFFTF|VGF|AFF|VPSF|VPTF)\s*\d+$/i.test(tail)) {
        slotRoom = tail.replace(/\s+/g, '').toUpperCase();
        parts.pop();
      }
      if (parts.length > 1 && /^(L|T|P)$/i.test(parts[parts.length - 1])) typeCode = parts.pop();
      const subject = parts.join('-') || activity;

      addEntry(`II ECE ${section}`, day, range[0], range[1], subject, slotRoom,
        null, inferType(subject, typeCode ? `-${typeCode}` : ''));
      count++;
    }
  }
  console.log(`ECE: 6 groups, ${count} entries`);
} catch (e) {
  console.error('ECE: parse failed -', e.message);
}

// ------------------------------------------------------------------ CSE ----
try {
  const wb = XLSX.readFile(path.join(rawDir, 'cse_3rd_year.xlsx'));
  let count = 0;

  for (const sheetName of wb.SheetNames) {
    if (!/^Sec \d+$/.test(sheetName)) continue;
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    if (!grid || grid.length < 4) continue;

    const room = (String(grid[0][0] || '').match(/\[([^\]]+)\]/) || [])[1] || null;
    const groupName = `III CSE-${sheetName}`;
    addGroup(groupName, 3, 'CSE', sheetName);
    if (room) rooms.add(room.trim().toUpperCase());

    const { headerRow, colTimes } = findTimeColumns(grid, 5);
    if (headerRow === -1) continue;

    // The sheet repeats Mon/Tue for a second week; a weekly grid keeps the first.
    const seenDays = new Set();
    for (let r = headerRow + 1; r < grid.length; r++) {
      const row = grid[r] || [];
      const day = toDay(row[0]);
      if (!day || seenDays.has(day)) continue;
      seenDays.add(day);

      for (const idx of Object.keys(colTimes)) {
        const cell = row[idx];
        if (!cell || isNoise(cell)) continue;
        const { subject, faculty } = splitSubjectFaculty(cell);
        if (!subject || isNoise(subject)) continue;
        const [start, end] = colTimes[idx];
        addEntry(groupName, day, start, end, subject, room, faculty, inferType(subject));
        count++;
      }
    }
  }
  console.log(`CSE: 22 groups, ${count} entries`);
} catch (e) {
  console.error('CSE: parse failed -', e.message);
}

// ----------------------------------------------------------------- SASH ----
try {
    const wb = XLSX.readFile(path.join(rawDir, 'sash_division_4.xlsx'));
    let count = 0;

    // Division 4 sheets carry the branch in the section header ("SECTION - 30 (AIML)").
    const sashDept = {};
    for (const name of wb.SheetNames) {
      const grid = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
      const head = String((grid && grid[0] && grid[0][0]) || '');
      const m = head.match(/SECTION\s*[-\u2013]?\s*\d+\s*\(([^)]*)\)/i);
      const dept = m ? branchToDepartment(m[1]) : null;
      if (dept) sashDept[name.replace(/^New\s+/, '').trim()] = dept;
    }

  for (const sheetName of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    if (!grid || grid.length < 6) continue;

    const sectionLabel = sheetName.replace(/^New\s+/, '').trim();
    const groupName = `I SASH SEC-${sectionLabel}`;
    addGroup(groupName, 1, sashDept[sectionLabel] || 'SASH', `SEC-${sectionLabel}`);

    const { headerRow, colTimes } = findTimeColumns(grid, 6);
    if (headerRow === -1) continue;

    const { map: facultyByCode } = readLegend(grid, /^(TOTAL|COORDINATOR|COUNSELOR|ACADEMIC LEAD)/i);

    for (let r = headerRow + 1; r < grid.length; r++) {
      const row = grid[r] || [];
      const day = toDay(row[0]);
      if (!day) continue;

      for (const idx of Object.keys(colTimes)) {
        const cell = row[idx];
        if (!cell || isNoise(cell)) continue;
        const text = String(cell).trim();
        const [subjectLine, roomLine] = text.split('\n');
        const subject = (subjectLine || '').trim();
        if (!subject || isNoise(subject)) continue;
        const code = subject.replace(/\s*\(.*\)\s*$/, '').trim().toUpperCase();
        const faculty = facultyByCode[code] || null;
        const [start, end] = colTimes[idx];
        addEntry(groupName, day, start, end, subject, roomLine && roomLine.trim(), faculty,
          inferType(subject));
        count++;
      }
    }
  }
  console.log(`SASH: 15 groups, ${count} entries`);
} catch (e) {
  console.error('SASH: parse failed -', e.message);
}

// ------------------------------------- SASH X-Stream and Y-Stream (year I) ----
// These two source workbooks are no longer in the repository, so their contents
// are recovered from the master cell dump. Division 4 (22.10.26) reissues some
// of the same sections with a different timetable and owns them where it does.
try {
  const div4Sections = new Set();
  for (const entry of master.bySheet.values()) {
    if (entry.file === DIV4_FILE) div4Sections.add(entry.sheet.replace(/^New\s+/, '').trim());
  }

  for (const [file, streamCode] of [[X_STREAM_FILE, 'X'], [Y_STREAM_FILE, 'Y']]) {
    let count = 0;
    for (const sheet of sheetsOf(master, file)) {
      const label = sectionLabel(sheet.rows);
      if (!label || div4Sections.has(label.number)) continue; // Division 4 supersedes

      const { entries: parsed, rooms: usedRooms } = parseStreamSheet(sheet.rows, master.catalogue);
      if (!parsed.length) continue;

      const groupName = `I ${streamCode} SEC-${label.number}`;
      addGroup(groupName, 1, branchToDepartment(label.stream) || 'SASH', `SEC-${label.number}`);
      for (const r of usedRooms) rooms.add(r);
      for (const e of parsed) {
        addEntry(groupName, e.day, e.startTime, e.endTime, e.subject, e.room, e.faculty, e.entryType);
        count++;
      }
    }
    console.log(`SASH ${streamCode}-Stream: ${count} entries`);
  }
} catch (e) {
  console.error('SASH streams: parse failed -', e.message);
}

// ------------------------------------------------------- BT and BIOINFO ----
function parseLabDepartment(file, sheetFilter, deptCode, yearOf, headerScan) {
  const wb = XLSX.readFile(path.join(rawDir, file));
  let count = 0;

  for (const sheetName of wb.SheetNames) {
    if (!sheetFilter(sheetName)) continue;
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    if (!grid || grid.length < 10) continue;

    const groupName = sheetName.trim();
    addGroup(groupName, yearOf(sheetName), deptCode, groupName);

    let room = findRoom(grid, 6);
    if (room && room !== 'MOBILE') rooms.add(room);

    const { map: facultyBySubject, pairs: legendPairs } = readLegend(grid, /^(COUNSEL|TT I\/C)/i);

    const { headerRow, colTimes } = findTimeColumns(grid, headerScan);
    if (headerRow === -1) continue;

    for (let r = headerRow + 1; r < grid.length; r++) {
      const row = grid[r] || [];
      const day = toDay(row[0]);
      if (!day) continue;
      for (const idx of Object.keys(colTimes)) {
        const cell = row[idx];
        if (!cell || isNoise(cell)) continue;
        const subject = String(cell).trim();
        if (subject.length > 90) continue;
        const code = subject.replace(/\s*\(.*\)\s*$/, '').trim().toUpperCase();
        const faculty = facultyBySubject[code] || resolveByAcronym(code, legendPairs);
        const [start, end] = colTimes[idx];
        addEntry(groupName, day, start, end, subject,
          room && room !== 'MOBILE' ? room : null,
          faculty, inferType(subject));
        count++;
      }
    }
  }
  return count;
}

try {
  const n = parseLabDepartment(
    'biotechnology.xlsx',
    s => /BT|M\.Tech/.test(s) && !/Mobile|Lab/.test(s),
    'BT',
    s => (/^III/.test(s) ? 3 : /^IV/.test(s) ? 4 : /M\.Tech/.test(s) ? 1 : 2),
    10
  );
  console.log(`BT: ${n} entries`);
} catch (e) {
  console.error('BT: parse failed -', e.message);
}

try {
  const n = parseLabDepartment(
    'bioinformatics.xlsx',
    s => ['II BI', 'III BI', 'IV BI A', 'IV BI B'].includes(s),
    'BIOINFO',
    s => (s.startsWith('II ') ? 2 : s.startsWith('III') ? 3 : 4),
    12
  );
  console.log(`BIOINFO: ${n} entries`);
} catch (e) {
  console.error('BIOINFO: parse failed -', e.message);
}

// ----------------------------------------------------------------- output --
const cleanRooms = Array.from(new Set(
  Array.from(rooms).map(r => r.trim().toUpperCase())
    .filter(r => r && r !== 'MOBILE' && r.length < 30)
)).sort();

// Each entry carries the owning department so the seed can attribute a faculty
// member to the branch they actually teach for, rather than to a default.
const groupDepartment = new Map(groups.map(g => [g.name, g.departmentCode]));
for (const e of entries) e.departmentCode = groupDepartment.get(e.group) || null;

const output = { departments: DEPARTMENTS, groups, rooms: cleanRooms, entries };
const namedFaculty = new Set(entries.map(e => e.faculty).filter(Boolean));

console.log('--- COMPILE SUMMARY ---');
console.log('Departments:', output.departments.length);
console.log('Groups:', groups.length);
console.log('Rooms:', cleanRooms.length);
console.log('Entries:', entries.length);
console.log('Distinct named faculty:', namedFaculty.size);
console.log('Entries without a faculty name:', entries.filter(e => !e.faculty).length);

const outputPath = path.join(dataDir, 'all_compiled_timetables.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Saved ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
