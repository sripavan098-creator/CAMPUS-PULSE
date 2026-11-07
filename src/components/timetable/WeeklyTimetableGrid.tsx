import React from 'react';
import { TimetableEntry, DayOfWeek } from '../../types';
import { DAYS_OF_WEEK, TIME_SLOTS, formatTime12h, timeToMinutes } from '../../utils/timeUtils';
import { storageService } from '../../services/storageService';
import { useLookups } from '../../hooks/useLookups';
import { Clock, MapPin, User, BookOpen } from 'lucide-react';

interface WeeklyTimetableGridProps {
  entries: TimetableEntry[];
  currentDay?: DayOfWeek;
  currentTime?: string;
  onSelectEntry?: (entry: TimetableEntry) => void;
  showSection?: boolean;
}

export const WeeklyTimetableGrid: React.FC<WeeklyTimetableGridProps> = ({
  entries,
  currentDay = 'Monday',
  currentTime = '10:00',
  onSelectEntry,
  showSection = true
}) => {
  const { subjects, faculty: facultyList, rooms, buildings, sections } = useLookups();

  const getSubj = (id: string) => subjects.find(s => s.id === id);
  const getFac = (id: string) => facultyList.find(f => f.id === id || f.name === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const getBldg = (id: string) => buildings.find(b => b.id === id);
  const getSec = (id: string) => sections.find(s => s.id === id);

  const currentMin = timeToMinutes(currentTime);

    // Assign every entry to the single period it starts in. Overlap matching
    // drew a class that straddles a break into two columns.
    const entryBySlot = new Map<string, TimetableEntry>();
    for (const entry of entries) {
      const entryStart = timeToMinutes(entry.startTime);
      let bestIdx = -1;
      TIME_SLOTS.forEach((slot, i) => {
        if (slot.isBreak) return;
        if (timeToMinutes(slot.start) <= entryStart) bestIdx = i;
      });
      if (bestIdx === -1) bestIdx = TIME_SLOTS.findIndex(slot => !slot.isBreak);
      const key = `${entry.day}-${bestIdx}`;
      if (!entryBySlot.has(key)) entryBySlot.set(key, entry);
    }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px] text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
              <th className="py-3 px-3 w-28 text-left font-bold uppercase tracking-wider text-[11px] bg-slate-200/60 sticky left-0 z-10">
                Day \ Time
              </th>
              {TIME_SLOTS.map((slot, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-2 text-center font-bold border-l border-slate-200/80 ${
                    slot.isBreak ? 'bg-amber-50/70 text-amber-900 w-24' : 'text-slate-700 min-w-[120px]'
                  }`}
                >
                  <div className="text-[11px] font-mono">{slot.start} - {slot.end}</div>
                  <div className="text-[9px] font-normal text-slate-500 uppercase tracking-wide">
                    {slot.isBreak ? slot.label : `Period ${(slot as any).period}`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {DAYS_OF_WEEK.map(day => {
              const isToday = day === currentDay;

              return (
                <tr key={day} className={`hover:bg-slate-50/50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                  {/* Day header column */}
                  <td className={`py-4 px-3 font-bold sticky left-0 z-10 border-r border-slate-200 ${
                    isToday ? 'bg-blue-100/80 text-blue-900' : 'bg-slate-100/60 text-slate-800'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span>{day}</span>
                      {isToday && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                      )}
                    </div>
                  </td>

                  {/* Period cells */}
                  {TIME_SLOTS.map((slot, slotIdx) => {
                    if (slot.isBreak) {
                      return (
                        <td
                          key={slotIdx}
                          className="bg-amber-50/40 border-l border-slate-200 text-center py-2 px-1 text-[10px] text-amber-800/80 font-medium select-none"
                        >
                          {slot.label}
                        </td>
                      );
                    }

                    const matchingEntry = entryBySlot.get(`${day}-${slotIdx}`);

                    if (!matchingEntry) {
                      return (
                        <td
                          key={slotIdx}
                          className="border-l border-slate-200/70 p-2 text-center text-slate-300 font-mono text-[11px]"
                        >
                          —
                        </td>
                      );
                    }

                    const subj = getSubj(matchingEntry.subjectId);
                    const fac = getFac(matchingEntry.facultyId);
                    const room = getRoom(matchingEntry.roomId);
                    const bldg = getBldg(matchingEntry.buildingId);
                    const sec = getSec(matchingEntry.sectionId);

                    const isOngoingNow =
                      isToday &&
                      currentMin >= timeToMinutes(matchingEntry.startTime) &&
                      currentMin < timeToMinutes(matchingEntry.endTime);

                    return (
                      <td
                        key={slotIdx}
                        onClick={() => onSelectEntry && onSelectEntry(matchingEntry)}
                        className="border-l border-slate-200/70 p-1.5"
                      >
                        <div
                          className={`p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer shadow-xs ${
                            isOngoingNow
                              ? 'bg-red-50 border-red-300 ring-2 ring-red-400'
                              : matchingEntry.isLab
                              ? 'bg-teal-50/80 border-teal-200 hover:bg-teal-100/90'
                              : 'bg-blue-50/80 border-blue-200 hover:bg-blue-100/90'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono font-bold text-[10px] text-slate-800 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                              {subj?.code || matchingEntry.subjectId || 'SUBJ'}
                            </span>
                            {matchingEntry.isLab ? (
                              <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-1.5 rounded">
                                LAB
                              </span>
                            ) : null}
                          </div>

                          <p className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-1" title={subj?.name || matchingEntry.subjectId}>
                            {subj?.name || matchingEntry.subjectId}
                          </p>

                          <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600">
                            <div className="flex items-center gap-1 truncate text-slate-700 font-medium">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{fac?.name || matchingEntry.facultyId || 'Faculty'}</span>
                            </div>

                            <div className="flex items-center gap-1 font-mono font-semibold text-blue-700">
                              <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                              <span>{room?.roomNumber || matchingEntry.roomId || 'Room'}</span>
                              <span className="text-slate-400 text-[9px]">({bldg?.originalCode || matchingEntry.buildingId})</span>
                            </div>

                            {showSection && sec && (
                              <div className="text-[9px] text-slate-500 font-mono">
                                Sec: {sec.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

