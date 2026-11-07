import { DayOfWeek } from '../types';

export const TIME_SLOTS = [
  { start: '08:15', end: '09:05', label: 'Period 1', period: 1 },
  { start: '09:05', end: '09:55', label: 'Period 2', period: 2 },
  { start: '09:55', end: '10:05', label: 'Break', isBreak: true },
  { start: '10:05', end: '10:55', label: 'Period 3', period: 3 },
  { start: '10:55', end: '11:45', label: 'Period 4', period: 4 },
  { start: '11:45', end: '11:55', label: 'Break', isBreak: true },
  { start: '11:55', end: '12:45', label: 'Period 5', period: 5 },
  { start: '12:45', end: '13:35', label: 'Period 6', period: 6 },
  { start: '13:35', end: '14:25', label: 'Lunch', isBreak: true },
  { start: '14:25', end: '15:15', label: 'Period 7', period: 7 },
  { start: '15:15', end: '16:05', label: 'Period 8', period: 8 },
  { start: '16:05', end: '16:55', label: 'Period 9', period: 9 },
];

/**
 * One rendered column of a weekly timetable. Periods come from the start times
 * that actually exist for the section; the gaps between them become Break/Lunch
 * columns. Departments do not share a bell schedule (II AIML starts at 08:15
 * with a 12:40 lunch, some CSE sections run 09:55-10:45 first), so a single
 * hardcoded slot list cannot render every section without dropping classes.
 */
export interface TimetableColumn {
  key: string;
  start: string;
  end: string;
  kind: 'period' | 'break' | 'lunch';
  label: string;
}

/** A gap at least this long that straddles the lunch window reads as lunch. */
const LUNCH_MIN_MINUTES = 30;
const LUNCH_WINDOW_START = '12:40';
const LUNCH_WINDOW_END = '13:30';

function classifyGap(start: string, end: string): 'break' | 'lunch' {
  const span = timeToMinutes(end) - timeToMinutes(start);
  const coversLunch =
    timeToMinutes(start) <= timeToMinutes(LUNCH_WINDOW_START) &&
    timeToMinutes(end) >= timeToMinutes(LUNCH_WINDOW_END);
  return span >= LUNCH_MIN_MINUTES && coversLunch ? 'lunch' : 'break';
}

export function buildTimetableColumns(
  entries: { startTime: string; endTime: string }[]
): TimetableColumn[] {
  const intervals = new Map<string, { start: string; end: string }>();
  for (const entry of entries) {
    if (!entry.startTime || !entry.endTime) continue;
    if (timeToMinutes(entry.startTime) >= timeToMinutes(entry.endTime)) continue;
    intervals.set(entry.startTime, { start: entry.startTime, end: entry.endTime });
  }

  if (intervals.size === 0) {
    return TIME_SLOTS.map((slot, i) => ({
      key: slot.isBreak ? `legacy-${i}` : slot.start,
      start: slot.start,
      end: slot.end,
      kind: slot.isBreak ? 'break' : 'period',
      label: slot.label,
    }));
  }

  const ordered = [...intervals.values()].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
  );

  const columns: TimetableColumn[] = [];
  let period = 0;
  ordered.forEach((interval, i) => {
    if (i > 0) {
      const gapStart = ordered[i - 1].end;
      const gapEnd = interval.start;
      if (timeToMinutes(gapStart) < timeToMinutes(gapEnd)) {
        const previous = columns[columns.length - 1];
        if (previous && previous.kind !== 'period') {
          // A free period between two classes leaves two adjacent gaps; show one.
          previous.end = gapEnd;
          const kind = classifyGap(previous.start, previous.end);
          previous.kind = kind;
          previous.label = kind === 'lunch' ? 'Lunch' : 'Break';
        } else {
          const kind = classifyGap(gapStart, gapEnd);
          columns.push({
            key: `gap-${gapStart}-${gapEnd}`,
            start: gapStart,
            end: gapEnd,
            kind,
            label: kind === 'lunch' ? 'Lunch' : 'Break',
          });
        }
      }
    }
    period += 1;
    columns.push({
      key: interval.start,
      start: interval.start,
      end: interval.end,
      kind: 'period',
      label: `Period ${period}`,
    });
  });

  return columns;
}

/** A trailing section designator: "-A", "-01", " SEC-24", "-Sec 11". */
const SECTION_DESIGNATOR = /(?:[-\s](?:SEC|Sec)[-\s]?\d+|[-\s][A-Za-z]|[-\s]\d+)$/;

/**
 * The program a section belongs to, e.g. "II AIML-J" -> "II AIML". Only a
 * section designator is removed, so "III CSBS" stays "III CSBS" instead of
 * collapsing to "III" and dragging in every other third-year program.
 */
export function familyKey(sectionId: string): string {
  return sectionId.replace(SECTION_DESIGNATOR, '').trim();
}

export interface BellInterval {
  startTime: string;
  endTime: string;
}

function intervalsOverlap(a: BellInterval, b: BellInterval): boolean {
  return (
    timeToMinutes(a.startTime) < timeToMinutes(b.endTime) &&
    timeToMinutes(b.startTime) < timeToMinutes(a.endTime)
  );
}

/**
 * Times to draw for a section even while it is free, taken from its sibling
 * sections, which share the bell schedule. Returns [] when the family runs more
 * than one bell (SASH uses both :05/:55 and :10/:00; three I X SEC sections
 * start lunch at 12:50), because drawing either one would invent a time.
 */
export function selectBellEntries<T extends BellInterval & { sectionId: string }>(
  departmentEntries: T[],
  sectionId: string,
  ownEntries: BellInterval[]
): T[] {
  const family = familyKey(sectionId);
  if (!family) return [];

  const candidates = departmentEntries
    .filter(entry => entry.sectionId.startsWith(family))
    .filter(entry => !ownEntries.some(own =>
      intervalsOverlap(entry, own) &&
      !(entry.startTime === own.startTime && entry.endTime === own.endTime)
    ));

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i];
      const b = candidates[j];
      if (
        intervalsOverlap(a, b) &&
        !(a.startTime === b.startTime && a.endTime === b.endTime)
      ) {
        return [];
      }
    }
  }
  return candidates;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  // Source grids use a 12h clock without an AM/PM marker, so periods after
  // lunch arrive as 01:30-04:xx. Anything before 06:00 is an afternoon slot.
  const hour24 = h < 6 ? h + 12 : h;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const displayHours = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${displayHours}:${m.toString().padStart(2, '0')} ${period}`;
}

export function doIntervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  return aStart < bEnd && aEnd > bStart;
}

export function getCurrentDayAndSimulatedTime(timeOverride?: string, dayOverride?: DayOfWeek) {
  const now = new Date();
  const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as any;
  const currentActualDay = dayNames[now.getDay()];
  const day: DayOfWeek = dayOverride || (currentActualDay === ('Sunday' as any) ? 'Monday' : (currentActualDay as DayOfWeek));

  let time = timeOverride;
  if (!time) {
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    time = `${hours}:${minutes}`;
  }

  return { day, time };
}

