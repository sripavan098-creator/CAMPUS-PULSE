import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { Subject, Room, TimetableEntry, DayOfWeek } from '../../types';
import { DAYS_OF_WEEK, timeToMinutes, campusNow } from '../../utils/timeUtils';
import { useCampusClock } from '../../hooks/useCampusClock';
import { Clock } from 'lucide-react';

export const FacultyAvailabilityPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(campusNow().day);
  const [simulatedTime, setSimulatedTime] = useState(campusNow().time);
  const [timeOverridden, setTimeOverridden] = useState(false);
  const clock = useCampusClock();
  useEffect(() => {
    if (!timeOverridden) setSimulatedTime(clock.time);
  }, [clock.time, timeOverridden]);

  const { data: schedule, loading, error } = useApiResource<TimetableEntry[]>(
    () => apiService.getFacultyTimetable(),
    []
  );
  const { data: subjects } = useApiResource<Subject[]>(() => apiService.getSubjects(), []);
  const { data: rooms } = useApiResource<Room[]>(() => apiService.getRooms(), []);

  const getSubj = (id: string) => subjects.find(s => s.id === id || s.name === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);

  const dayKey = selectedDay.slice(0, 3).toUpperCase();
  const dayEntries = schedule
    .filter(e => (e.day || '').toUpperCase().startsWith(dayKey))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const targetMin = timeToMinutes(simulatedTime);
  const currentEntry = dayEntries.find(
    e => targetMin >= timeToMinutes(e.startTime) && targetMin < timeToMinutes(e.endTime)
  );
  const occupied = Boolean(currentEntry);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-[#142B4A]">My Free Slots & Student Consultation Hours</h1>
        <p className="text-xs text-slate-500">Live availability status computed from your official teaching schedule.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Simulate Target Time:</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedDay}
            onChange={e => setSelectedDay(e.target.value as DayOfWeek)}
            className="p-2 border border-slate-300 rounded-xl font-bold bg-slate-50"
          >
            {DAYS_OF_WEEK.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <input
            type="time"
            value={simulatedTime}
            onChange={e => { setTimeOverridden(true); setSimulatedTime(e.target.value); }}
            className="p-2 border border-slate-300 rounded-xl font-mono font-bold bg-slate-50"
          />
        </div>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading your teaching schedule…</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Could not load your schedule: {error}
        </p>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Live Availability at {simulatedTime} on {selectedDay}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
              {occupied ? 'Teaching Scheduled Class' : 'Available for Consultations'}
            </h2>
          </div>

          <span
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide shrink-0 ${
              occupied ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {occupied ? 'Occupied' : 'Available'}
          </span>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Assigned Teaching Periods on {selectedDay}
          </h3>

          <div className="space-y-2">
            {dayEntries.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl">
                No teaching sessions scheduled on {selectedDay}. Entire day is open for research and consultation.
              </p>
            ) : (
              dayEntries.map(e => (
                <div
                  key={e.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                      {e.startTime} - {e.endTime}
                    </span>
                    <span className="font-bold text-slate-800">{getSubj(e.subjectId)?.name || e.subjectId}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-700">
                    Room {getRoom(e.roomId)?.roomNumber || e.roomId || '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
