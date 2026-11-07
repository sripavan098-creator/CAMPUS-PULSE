'use strict';

/**
 * Shared parsing helpers for the workbook compiler.
 *
 * The department sheets are hand-built spreadsheets, so every extractor has to
 * cope with the same handful of quirks: 12-hour clock values with no AM/PM
 * marker, subject cells that also carry the faculty name, and a legend block
 * below the grid that maps a subject code to its teacher.
 */

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const DAY_ALIASES = {
  MON: 'MON', MONDAY: 'MON',
  TUE: 'TUE', TUESDAY: 'TUE',
  WED: 'WED', WEDNESDAY: 'WED',
  THU: 'THU', THURSDAY: 'THU',
  FRI: 'FRI', FRIDAY: 'FRI',
  SAT: 'SAT', SATURDAY: 'SAT'
};

/**
 * Normalize a sheet clock value to 24h HH:MM.
 *
 * Sheets omit AM/PM and write afternoon periods as 1.30, 2.20, 3.10. Anything
 * before the 08:15 first period is therefore an afternoon hour, so 01:30 means
 * 13:30. Without this, ECE's post-lunch columns were stored as AM and sorted to
 * the top of the day.
 */
function normalizeTime(raw) {
  if (raw === null || raw === undefined) return null;
  const m = String(raw).match(/(\d{1,2})\s*[.:]\s*(\d{2})/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  if (h < 8) h += 12;
  if (h >= 24) return null;
  return `${String(h).padStart(2, '0')}:${min}`;
}

/** Parse a header cell like "8.15-9.05" or "12.40-1.30" into [start, end]. */
function parseTimeRange(text) {
  if (text === null || text === undefined) return null;
  const m = String(text).match(/(\d{1,2}\s*[.:]\s*\d{2})\s*[-\u2013]\s*(\d{1,2}\s*[.:]\s*\d{2})/);
  if (!m) return null;
  const start = normalizeTime(m[1]);
  const end = normalizeTime(m[2]);
  if (!start || !end) return null;
  return [start, end];
}

/** Map a day label such as "Mon, 02-Nov-2026" or "MONDAY" to MON..SAT. */
function toDay(raw) {
  if (raw === null || raw === undefined) return null;
  const token = String(raw).trim().toUpperCase().replace(/[,\s].*$/, '');
  return DAY_ALIASES[token] || null;
}

const NOISE = new Set([
  '', 'BREAK', 'LUNCH', 'LUNCH BREAK', 'HOLIDAY', 'ACTIVITIES', 'LIB', 'LIBRARY',
  'COUNS', 'COUNSELLING', 'COUNSELING'
]);

function isNoise(value) {
  if (value === null || value === undefined) return true;
  const s = String(value).trim().toUpperCase();
  if (NOISE.has(s)) return true;
  // Generic activity descriptors occupy grid cells but are not classes.
  return /SELF[\s/]|EXPERIENTIAL|LEARNING\/PROJECTS/.test(s);
}

/**
 * Split a timetable cell into its subject and the faculty printed underneath.
 *
 * CSE writes "CE\n(Ms. Neeli Sarvani)" and SASH writes "LA (L)\nVBFTF 1"; the
 * parenthesised tail is a person only in the first shape, so the caller decides
 * whether to trust it.
 */
function splitSubjectFaculty(cell) {
  if (cell === null || cell === undefined) return { subject: null, faculty: null };
  const text = String(cell).trim();
  const newline = text.indexOf('\n');
  if (newline === -1) return { subject: text, faculty: null };
  const subject = text.slice(0, newline).trim();
  const tail = text.slice(newline + 1).trim();
  const paren = tail.match(/^\((.+)\)$/);
  return { subject, faculty: paren ? paren[1].trim() : null };
}

/**
 * Tidy a faculty name for display and de-duplication.
 *
 * Legend cells use several formats: "Dr.Jhili Mishra[9150938512]/Dr Krishna D",
 * "Dr. A Subrahmanyam(ACSE){7382404407}", "Dr K Sankaran, Mr. Chenniah". Phone
 * numbers, department tags and alternative names are dropped; the first named
 * teacher is kept because that is the one printed against the class.
 */
function cleanFacultyName(raw) {
  if (raw === null || raw === undefined) return null;
  let name = String(raw).split('\n')[0];
  name = name.split('/')[0];
  name = name.replace(/\[[^\]]*\]/g, '');
  name = name.replace(/\{[^}]*\}/g, '');
  name = name.replace(/\([^)]*\)/g, '');
  name = name.replace(/\d{6,}/g, '');
  name = name.replace(/\s+/g, ' ').trim();
  // Legends use a trailing dash or stray bracket as a separator, which would
  // otherwise split one teacher into two records (e.g. "Dr. U Sriranganath-").
  name = name.replace(/[\s,;:./\\|-]+$/, '');
  name = name.replace(/[(\[]+$/, '').trim();
  name = name.replace(/[\s,;:./\\|-]+$/, '');
  if (!name || name.length < 3) return null;
  if (/^(faculty|hod|tt i\/c|coordinator|x+)$/i.test(name)) return null;
  if (/^(training|library|counsel)/i.test(name)) return null;
  return name;
}

module.exports = {
  DAYS,
  normalizeTime,
  parseTimeRange,
  toDay,
  isNoise,
  splitSubjectFaculty,
  cleanFacultyName
};
