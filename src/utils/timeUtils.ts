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

