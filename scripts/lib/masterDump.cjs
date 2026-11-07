'use strict';

/**
 * Read the room/timetable master workbook.
 *
 * `master_rooms_and_timetables.xlsx` is a lossless dump of every filled cell of
 * every department timetable file, keyed by (source file, sheet, row, column).
 * Two of those source files — the X-Stream and Y-Stream I B.Tech timetables — were
 * never copied into the repository, so this dump is the only remaining copy of
 * their contents and is used to reconstruct them.
 */

const path = require('path');
const XLSX = require('xlsx');

const MASTER = 'master_rooms_and_timetables.xlsx';

/** Room-code prefixes used across the campus. */
const ROOM_PREFIX = /^(VBFFTF|VBFFT|VBFTF|VBFF|VBSF|VBTF|VPTF|VPSF|VPFTF|VFF|VGF|AFF|ASF|ATF|NB|N|H|U|P|A|VBT|VTF)[\s-]*[0-9A-Z]*$/i;

function loadMaster(rawDir) {
  const wb = XLSX.readFile(path.join(rawDir, MASTER));

  const cells = XLSX.utils.sheet_to_json(wb.Sheets['Timetable cells'], { header: 1 });
  // (source file, sheet) -> row -> col -> text
  const bySheet = new Map();
  for (let i = 1; i < cells.length; i++) {
    const [file, sheet, row, col, text] = cells[i];
    if (!file || !sheet || text === undefined || text === null) continue;
    const key = `${file}\u0000${sheet}`;
    if (!bySheet.has(key)) bySheet.set(key, { file, sheet, rows: new Map() });
    const entry = bySheet.get(key);
    if (!entry.rows.has(row)) entry.rows.set(row, new Map());
    entry.rows.get(row).set(col, String(text));
  }

  const rooms = new Set();
  const roomRows = XLSX.utils.sheet_to_json(wb.Sheets['Rooms']);
  for (const r of roomRows) {
    for (const code of String(r['Room code(s) in timetables'] || '').split('|')) {
      const c = code.trim().toUpperCase();
      if (c && c !== 'MOBILE') rooms.add(c);
    }
  }

  return { bySheet, catalogue: rooms };
}

/** Sheets belonging to a given source file, in workbook order. */
function sheetsOf(master, file) {
  const out = [];
  for (const entry of master.bySheet.values()) {
    if (entry.file === file) out.push(entry);
  }
  return out;
}

/**
 * Resolve a room token against the master catalogue.
 *
 * The sheets disagree about dashes and zero padding ("NB-201" vs "NB201",
 * "VPTF 11" vs "VPTF-11"), so an exact miss is retried with the separator
 * stripped before the token is accepted verbatim.
 */
function canonicalRoom(token, catalogue) {
  if (!token) return null;
  const raw = String(token).trim().toUpperCase().replace(/\s+/g, '');
  if (!raw || raw === 'MOBILE' || raw.length > 30) return null;
  if (catalogue.has(raw)) return raw;
  const noDash = raw.replace(/-/g, '');
  for (const c of catalogue) {
    if (c.replace(/-/g, '') === noDash) return c;
  }
  return raw;
}

module.exports = { loadMaster, sheetsOf, canonicalRoom, ROOM_PREFIX };
