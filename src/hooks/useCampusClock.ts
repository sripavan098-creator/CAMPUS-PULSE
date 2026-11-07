import { useEffect, useState } from 'react';
import { campusNow } from '../utils/timeUtils';
import { DayOfWeek } from '../types';

/**
 * Campus-local day and time, refreshed every minute so the "ongoing /
 * completed" state of a class advances while the page stays open.
 */
export function useCampusClock(intervalMs = 30_000): { day: DayOfWeek; time: string } {
  const [now, setNow] = useState(() => campusNow());
  useEffect(() => {
    const id = setInterval(() => setNow(campusNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
