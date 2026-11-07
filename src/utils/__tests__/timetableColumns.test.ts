import { describe, it, expect } from 'vitest';
import { buildTimetableColumns, timeToMinutes } from '../timeUtils';

/**
 * Regression guard for the weekly grid dropping classes. The grid used to render
 * a hardcoded slot list whose period boundaries (10:05, 11:45, 13:35, 14:25) do
 * not exist in the source timetables (10:10, 11:00, 11:50, 13:40, 14:30). Every
 * class that started at one of the real times was filed under the nearest
 * earlier hardcoded column, and when two classes landed on the same column the
 * second was silently discarded.
 */
describe('buildTimetableColumns', () => {
  const aimlJMonday = [
    { startTime: '08:15', endTime: '09:05' },
    { startTime: '10:10', endTime: '11:00' },
    { startTime: '11:00', endTime: '11:50' },
    { startTime: '13:40', endTime: '14:30' },
    { startTime: '14:30', endTime: '15:20' },
  ];

  it('gives every real class its own period column', () => {
    const columns = buildTimetableColumns(aimlJMonday);
    const periods = columns.filter(c => c.kind === 'period');
    expect(periods.map(p => p.start)).toEqual(['08:15', '10:10', '11:00', '13:40', '14:30']);
  });

  it('keeps the exact source times instead of rounding them to a hardcoded bell', () => {
    const columns = buildTimetableColumns(aimlJMonday);
    const known = ['08:15', '09:05', '10:10', '11:00', '11:50', '12:40', '13:40', '14:30', '15:20'];
    for (const column of columns) {
      expect(known).toContain(column.start);
      expect(known).toContain(column.end);
    }
  });

  it('marks the 12:40-13:40 gap as lunch and the short gap as break', () => {
    const columns = buildTimetableColumns([
      { startTime: '11:50', endTime: '12:40' },
      { startTime: '13:40', endTime: '14:30' },
    ]);
    expect(columns.map(c => c.kind)).toEqual(['period', 'lunch', 'period']);
    expect(columns[1].start).toBe('12:40');
    expect(columns[1].end).toBe('13:40');
  });

  it('treats a short morning gap as a break, not lunch', () => {
    const columns = buildTimetableColumns([
      { startTime: '09:05', endTime: '09:55' },
      { startTime: '10:10', endTime: '11:00' },
    ]);
    const gaps = columns.filter(c => c.kind !== 'period');
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe('break');
    expect(gaps[0].start).toBe('09:55');
    expect(gaps[0].end).toBe('10:10');
  });

  it('falls back to the legacy bell when there are no entries', () => {
    const columns = buildTimetableColumns([]);
    expect(columns.length).toBeGreaterThan(0);
    expect(columns.some(c => c.kind === 'period')).toBe(true);
  });

  it('ignores malformed intervals rather than rendering an inverted column', () => {
    const columns = buildTimetableColumns([
      { startTime: '10:10', endTime: '11:00' },
      { startTime: '12:00', endTime: '12:00' },
      { startTime: '', endTime: '13:00' },
    ]);
    const periods = columns.filter(c => c.kind === 'period');
    expect(periods).toHaveLength(1);
    expect(periods[0].start).toBe('10:10');
  });

  it('sorts out-of-order input by start time', () => {
    const columns = buildTimetableColumns([
      { startTime: '14:30', endTime: '15:20' },
      { startTime: '08:15', endTime: '09:05' },
      { startTime: '10:10', endTime: '11:00' },
    ]);
    const starts = columns.filter(c => c.kind === 'period').map(c => timeToMinutes(c.start));
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });
});
