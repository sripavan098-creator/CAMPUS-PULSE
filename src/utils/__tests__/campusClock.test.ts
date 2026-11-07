import { describe, it, expect } from 'vitest';
import { campusNow, getCurrentDayAndSimulatedTime } from '../timeUtils';

describe('campusNow', () => {
  it('reads the campus clock (Asia/Kolkata), not the host clock', () => {
    // 18:45 UTC is 00:15 the next day in Asia/Kolkata.
    const now = campusNow(new Date('2026-08-17T18:45:00Z'));
    expect(now.time).toBe('00:15');
    expect(now.day).toBe('Tuesday');
  });

  it('maps Sunday to Monday so the timetable never opens on a day with no classes', () => {
    // 2026-08-16 is a Sunday; 04:00 UTC is 09:30 IST.
    const now = campusNow(new Date('2026-08-16T04:00:00Z'));
    expect(now.day).toBe('Monday');
    expect(now.time).toBe('09:30');
  });

  it('lets an explicit day/time override win over the live clock', () => {
    expect(getCurrentDayAndSimulatedTime('15:24', 'Saturday')).toEqual({ day: 'Saturday', time: '15:24' });
  });

  it('falls back to the live campus clock when no override is given', () => {
    const live = campusNow();
    expect(getCurrentDayAndSimulatedTime()).toEqual(live);
  });
});
