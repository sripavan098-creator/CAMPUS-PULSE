'use strict';

/**
 * Parser for the SASH "I B.Tech" stream timetables (X-Stream and Y-Stream).
 *
 * Both workbooks share one layout: a time-range header row, six day rows, then a
 * legend block that maps a subject code to the teacher printed against it. The
 * grid cell holds "SUBJECT / ROOM" or "SUBJECT LAB / (Block … ROOM)".
 *
 * The two source workbooks are no longer in the repository; the parser is fed the
 * cell dump taken from `master_rooms_and_timetables.xlsx` (see masterDump.cjs).
 */

const { parseTimeRange, toDay, isNoise, cleanFacultyName } = require('./parseHelpers.cjs');
const { canonicalRoom, ROOM_PREFIX } = require('./masterDump.cjs');

const DAY_RE = /^(MON|TUE|WED|THU|FRI|SAT)\b/i;

/** Break/lunch/free markers that occupy a cell but are not classes. */
const NON_CLASS = /^(BREAK|LUNCH|LUNCH BREAK|LIBRARY|LIB|SPORTS|PHYSICAL FITNESS|HOLIDAY|COUNSEL|COUNSELLING|COUNSELING|MENTOR|MENTORING|ACTIVIT)/i;

/** A room written inside a "(…)" block label, e.g. "(N-Block I Floor-NB106)". */
const LABEL_ROOM = /(?:FLOOR|BLOCK)[\s\-–]*([A-Z]{1,3}[\s-]*\d{1,3}[A-Z]?)\s*$/i;

function textOf(map, col) {
  const v = map.get(col);
  return v === undefined || v === null ? '' : String(v).trim();
}

/** Header row is the first row carrying at least four time ranges. */
function findHeader(rows) {
  for (const r of [...rows.keys()].sort((a, b) => a - b)) {
    const cols = {};
    for (const [col, text] of rows.get(r)) {
      const range = parseTimeRange(text);
      if (range) cols[col] = range;
    }
    if (Object.keys(cols).length >= 4) return { headerRow: r, colTimes: cols };
  }
  return { headerRow: -1, colTimes: {} };
}

/**
 * Pull a room code out of a free-form room description.
 *
 * The sheets write the same room many ways: "(A- Block V floor-VBFFTF-03)",
 * "VPTF 07&08", "NB201". The block/floor label is dropped and the code is
 * normalised by the master catalogue downstream.
 */
// Longest prefixes first so "VBFFTF" wins over "VBFF".
const ROOM_TOKEN_RE = /\b(VBFFTF|VBFFT|VBFTF|VBFF|VBSF|VBTF|VPTF|VPSF|VPFTF|VFF|VGF|VSF|VTF|AFF|ASF|ATF|VBT|NB|N|H|U|P|A)[\s-]*(\d{1,3}[A-Z]?)\b/gi;

function extractRoomToken(text) {
  if (!text) return null;
  const s = String(text).trim().replace(/^\((.*)\)$/s, '$1').trim();
  const matches = [...s.matchAll(ROOM_TOKEN_RE)];
  if (!matches.length) return null;
  const last = matches[matches.length - 1];
  return `${last[1]}-${last[2]}`;
}

/**
 * Split a grid cell into subject and room.
 *
 * "TEC LAB / (P-Block-II Floor-VPSF-05)"  -> subject "TEC LAB", room "VPSF-05"
 * "MS / NB202"                            -> subject "MS",      room "NB202"
 * "Agentic AI Tools"                      -> subject only (mobile section)
 */
function splitCell(text) {
  let subject = text.split('\n')[0];
  let room = null;

  const slash = subject.indexOf(' / ');
  if (slash !== -1) {
    room = subject.slice(slash + 3).trim();
    subject = subject.slice(0, slash).trim();
  }

  const paren = subject.match(/\(([^)]*)\)/);
  if (paren) {
    if (!room) room = paren[1];
    subject = subject.replace(paren[0], ' ').trim();
  }

  subject = subject.replace(/\s*\([LTP]\)\s*$/i, '').trim();
  subject = subject.replace(/[-/]+$/, '').trim();
  return { subject, room: extractRoomToken(room) };
}

/** Teacher names in the legend always start with a title or carry an initial. */
function looksLikePerson(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  if (/^(DR|MR|MRS|MS|MISS|PROF|SK|SRI|SMT)\b/i.test(s)) return true;
  return /\b[A-Z]\./.test(s);
}

/**
 * Read the legend block below the grid.
 *
 * The label column and faculty column are detected rather than hard-coded: some
 * sheets prefix a Sl.No. column, and the label may sit in column 1 or 2.
 */
function readLegend(rows, gridEnd) {
  const map = new Map();
  const pairs = [];

  let labelCol = null;
  const facultyCols = [];
  for (const r of [...rows.keys()].sort((a, b) => a - b)) {
    if (r <= gridEnd) continue;
    for (const [col, text] of rows.get(r)) {
      if (/^\s*Subject/i.test(text)) labelCol = col;
      if (/^\s*Faculty/i.test(text)) facultyCols.push(col);
    }
  }

  if (labelCol === null) {
    for (const cand of [2, 1, 3]) {
      let n = 0;
      for (const r of rows.keys()) {
        if (r > gridEnd && textOf(rows.get(r), cand)) n++;
      }
      if (n >= 3) { labelCol = cand; break; }
    }
  }

  const facCols = facultyCols.length
    ? facultyCols
    : [1, 2, 3, 4, 5, 6, 7, 8]
        .map(c => ({ c, n: [...rows.keys()].filter(r => r > gridEnd && looksLikePerson(textOf(rows.get(r), c))).length }))
        .filter(x => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .map(x => x.c);

  if (labelCol === null) return { map, pairs };

  for (const r of [...rows.keys()].sort((a, b) => a - b)) {
    if (r <= gridEnd) continue;
    const label = textOf(rows.get(r), labelCol);
    if (!label) continue;
    if (/^(TOTAL|COORDINATOR|COUNSEL|ACADEMIC LEAD|TIME TABLE|DEAN)/i.test(label)) break;

    let name = null;
    for (const col of facCols) {
      const v = textOf(rows.get(r), col);
      if (looksLikePerson(v)) { name = cleanFacultyName(v); if (name) break; }
    }
    if (!name) continue;

    pairs.push({ label, name });
    const put = (key) => {
      const k = String(key || '').trim().toUpperCase();
      if (k && !map.has(k)) map.set(k, name);
    };
    put(label);
    put(label.split('(')[0]);
    put(label.split('/')[0]);
    put(label.split('-')[0]);
    for (const p of label.match(/\(([^)]+)\)/g) || []) put(p.slice(1, -1));
  }
  return { map, pairs };
}

/** Initials of a legend subject, tried with and without joining words. */
function acronymsOf(label) {
  const words = String(label)
    .replace(/\([^)]*\)/g, '')
    .split(/[\s&/]+/)
    .map(w => w.replace(/[^A-Za-z]/g, '').toUpperCase())
    .filter(Boolean);
  const init = (skip) => words.filter(w => !skip.has(w)).map(w => w[0]).join('');
  return new Set([init(new Set()), init(new Set(['AND', 'THE'])), init(new Set(['AND', 'THE', 'OF']))]);
}

function resolveByAcronym(code, pairs) {
  const key = String(code || '').toUpperCase();
  if (!key || !pairs.length) return null;
  const hits = pairs.filter(p => acronymsOf(p.label).has(key));
  if (hits.length === 1) return hits[0].name;
  if (hits.length > 1) return null;

  // A sheet may drop one letter of a legend acronym ("BEE LAB" for "BEEE"). Accept
  // it only when a single legend acronym is one character longer and nothing else
  // could match, so "PC" never resolves to "PCT".
  if (key.length < 3) return null;
  const near = pairs.filter(p => [...acronymsOf(p.label)].some(a => a.startsWith(key) && a.length === key.length + 1));
  const names = new Set(near.map(p => p.name));
  return names.size === 1 ? near[0].name : null;
}

/** Candidate keys for a grid code: the code itself and its lab/period stem. */
function codeCandidates(code) {
  const key = String(code || '').toUpperCase().trim();
  if (!key) return [];
  const stem = key.replace(/\s*\([LTP]\)\s*$/, '').replace(/\s*LAB\s*$/, '').trim();
  return stem && stem !== key ? [key, stem] : [key];
}

/**
 * Last-resort match: one legend subject is a prefix of the grid code.
 *
 * The grid writes "Agentic AI Tools" where the legend says "Agentic AI", so an
 * exact-only match drops a teacher who is plainly listed. Only a single, long
 * prefix is accepted, so a short code like "PC" cannot capture "PCT".
 */
function resolveByPrefix(code, pairs) {
  const key = String(code || '').toUpperCase();
  if (key.length < 5) return null;
  const hits = pairs.filter(p => {
    const label = p.label.toUpperCase().replace(/\s*\([^)]*\)\s*$/, '').trim();
    return label.length >= 5 && key.startsWith(label);
  });
  const names = new Set(hits.map(h => h.name));
  return names.size === 1 ? hits[0].name : null;
}

/** Resolve a grid code to a teacher via the legend map, then by acronym, then prefix. */
function resolveFaculty(code, facultyByCode, pairs) {
  for (const key of codeCandidates(code)) {
    if (facultyByCode.has(key)) return facultyByCode.get(key);
    const byAcronym = resolveByAcronym(key, pairs);
    if (byAcronym) return byAcronym;
    const byPrefix = resolveByPrefix(key, pairs);
    if (byPrefix) return byPrefix;
  }
  return null;
}

/** Strip a trailing room token that a sheet appended to the subject. */
function stripTrailingRoom(subject, catalogue) {
  const parts = subject.split(/\s*[-–]\s*|\s{2,}/).map(p => p.trim()).filter(Boolean);
  const keep = [];
  for (const p of parts) {
    if (ROOM_PREFIX.test(p) && canonicalRoom(p, catalogue)) break;
    keep.push(p);
  }
  return keep.join(' ').trim();
}

/**
 * Parse one stream sheet into entries.
 * Returns { entries, rooms } where each entry is
 * { day, startTime, endTime, subject, room, faculty, entryType }.
 */
function parseStreamSheet(rows, catalogue) {
  const { headerRow, colTimes } = findHeader(rows);
  if (headerRow === -1) return { entries: [], rooms: [] };

  const dayRows = [];
  for (const r of [...rows.keys()].sort((a, b) => a - b)) {
    if (r <= headerRow) continue;
    const day = toDay(textOf(rows.get(r), 1));
    if (day) dayRows.push({ row: r, day });
  }
  if (!dayRows.length) return { entries: [], rooms: [] };

  const gridEnd = dayRows[dayRows.length - 1].row;
  const { map: facultyByCode, pairs } = readLegend(rows, gridEnd);

  const entries = [];
  const rooms = new Set();

  for (const { row, day } of dayRows) {
    const cells = rows.get(row);
    for (const col of Object.keys(colTimes)) {
      const raw = textOf(cells, Number(col));
      if (!raw || isNoise(raw)) continue;
      const { subject: rawSubject, room, roomHint } = splitCell(raw);
      if (!rawSubject || isNoise(rawSubject) || NON_CLASS.test(rawSubject)) continue;

      const subject = stripTrailingRoom(rawSubject, catalogue);
      if (!subject || !/[A-Za-z0-9]/.test(subject) || NON_CLASS.test(subject)) continue;

      const faculty = resolveFaculty(subject, facultyByCode, pairs);

      const roomToken = room || roomHint;
      const roomId = roomToken ? canonicalRoom(roomToken, catalogue) : null;
      if (roomId) rooms.add(roomId);

      const [startTime, endTime] = colTimes[col];
      const type = /LAB|\(P\)|\bP\b/i.test(raw) ? 'lab' : 'class';
      entries.push({ day, startTime, endTime, subject, room: roomId, faculty, entryType: type });
    }
  }

  return { entries, rooms };
}

/** The section label sits in the header block, e.g. "SEC-01( CSE-H) X-STREAM". */
function sectionLabel(rows) {
  for (const r of [...rows.keys()].sort((a, b) => a - b).slice(0, 8)) {
    const text = textOf(rows.get(r), 1);
    const m = text.match(/^\s*(?:SECTION\s*[-–]?\s*|SEC\s*[-–]?\s*)(\d{1,3})\s*\(?([^)]*)\)?/i);
    if (m) return { number: m[1], stream: (m[2] || '').trim() };
  }
  return null;
}

/**
 * Branch name -> owning department.
 *
 * An I B.Tech section is published by the School of Applied Science & Humanities
 * but its students belong to a branch ("AIML-H", "IT - H+D", "CSE-D"), so the
 * branch decides the department rather than the publishing school. The first
 * branch token is used because compound labels stack branches ("BT+BI", "DS+IOT+CSBS").
 */
const BRANCH_DEPARTMENT = {
  CSE: 'CSE', CSECS: 'CSE', CSBS: 'CSE', CS: 'CSE', DS: 'CSE', IOT: 'CSE',
  ECE: 'ECE', VLSI: 'ECE',
  EEE: 'EEE',
  AIML: 'AIML',
  MECH: 'MECH', RA: 'MECH',
  IT: 'IT',
  CIVIL: 'CIVIL',
  CHEM: 'SASH', TT: 'SASH',
  BT: 'BT', FT: 'BT',
  BM: 'BIOINFO', BIO: 'BIOINFO'
};

function branchToDepartment(branch) {
  const first = String(branch || '')
    .toUpperCase()
    .split(/[-\s]/)[0]
    .split('+')[0]
    .replace(/[^A-Z]/g, '');
  return BRANCH_DEPARTMENT[first] || null;
}

module.exports = { parseStreamSheet, sectionLabel, branchToDepartment, DAY_RE };
