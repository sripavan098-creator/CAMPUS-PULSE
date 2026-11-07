import React from 'react';
import { TimetableEntry, DayOfWeek } from '../../types';
import { storageService } from '../../services/storageService';
import { useLookups } from '../../hooks/useLookups';
import { timeToMinutes, formatTime12h } from '../../utils/timeUtils';
import { Clock, MapPin, User, BookOpen, Layers, CheckCircle, AlertCircle } from 'lucide-react';

interface DailyTimetableListProps {
  entries: TimetableEntry[];
  day: DayOfWeek;
  currentTime?: string;
  onSelectEntry?: (entry: TimetableEntry) => void;
}

export const DailyTimetableList: React.FC<DailyTimetableListProps> = ({
  entries,
  day,
  currentTime = '10:00',
  onSelectEntry
}) => {
  const { subjects, faculty: facultyList, rooms, buildings, floors, sections } = useLookups();

  const getSubj = (id: string) => subjects.find(s => s.id === id);
  const getFac = (id: string) => facultyList.find(f => f.id === id || f.name === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const getBldg = (id: string) => buildings.find(b => b.id === id);
  const getFlr = (id: string) => floors.find(f => f.id === id);
  const getSec = (id: string) => sections.find(s => s.id === id);

  const currentMin = timeToMinutes(currentTime);

  const dayEntries = entries
    .filter(e => e.day === day)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  if (dayEntries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <h4 className="text-sm font-bold text-slate-700">No scheduled academic classes for {day}</h4>
        <p className="text-xs text-slate-400 mt-1">This day is free from regular lectures and laboratories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dayEntries.map((entry, idx) => {
        const subj = getSubj(entry.subjectId);
        const fac = getFac(entry.facultyId);
        const room = getRoom(entry.roomId);
        const bldg = getBldg(entry.buildingId);
        const flr = getFlr(entry.floorId);
        const sec = getSec(entry.sectionId);

        const startMin = timeToMinutes(entry.startTime);
        const endMin = timeToMinutes(entry.endTime);

        const isPast = currentMin >= endMin;
        const isOngoing = currentMin >= startMin && currentMin < endMin;
        const isUpcoming = currentMin < startMin;

        return (
          <div
            key={entry.id}
            onClick={() => onSelectEntry && onSelectEntry(entry)}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              isOngoing
                ? 'bg-red-50/80 border-red-300 shadow-md ring-2 ring-red-400/50'
                : isPast
                ? 'bg-slate-50/70 border-slate-200 opacity-75'
                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-4">
                {/* Time slot column */}
                <div className="text-center shrink-0 w-24">
                  <span className="block font-mono font-bold text-sm text-slate-900">
                    {entry.startTime}
                  </span>
                  <span className="text-[11px] text-slate-400">to {entry.endTime}</span>

                  <div className="mt-1">
                    <span
                      className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isOngoing
                          ? 'bg-red-500 text-white animate-pulse'
                          : isPast
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isOngoing ? 'Ongoing' : isPast ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                </div>

                {/* Class details */}
                <div className="border-l border-slate-200 pl-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                      {subj?.code || entry.subjectId || 'CODE'}
                    </span>
                    {entry.isLab && (
                      <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                        LABORATORY
                      </span>
                    )}
                    {sec && (
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                        Sec {sec.name}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900">
                    {subj?.name || entry.subjectId || 'Class Subject'}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{fac?.name || entry.facultyId || 'Faculty Member'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-blue-700 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{room?.roomNumber || entry.roomId}</span>
                      <span className="text-slate-500 font-sans text-xs">
                        ({bldg?.name || entry.buildingId} • {flr?.name})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Status / Duration */}
              <div className="text-right sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="text-xs text-slate-400 font-mono">
                  Duration: {timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime)} mins
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

