import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Printer,
  History,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import {
  TimetableEntry,
  DayOfWeek,
  TimetableChange,
  Department,
  Subject,
  Room,
  Building,
  Section
} from '../../types';
import { timeToMinutes, DAYS_OF_WEEK, campusNow } from '../../utils/timeUtils';
import { useCampusClock } from '../../hooks/useCampusClock';
import { WeeklyTimetableGrid } from '../../components/timetable/WeeklyTimetableGrid';
import { DailyTimetableList } from '../../components/timetable/DailyTimetableList';

export const FacultyDashboard: React.FC = () => {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(campusNow().day);
  const [simulatedTime, setSimulatedTime] = useState(campusNow().time);
  const [timeOverridden, setTimeOverridden] = useState(false);
  const clock = useCampusClock();
  useEffect(() => {
    if (!timeOverridden) setSimulatedTime(clock.time);
  }, [clock.time, timeOverridden]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [changes, setChanges] = useState<TimetableChange[]>([]);

  const [, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [, setBuildings] = useState<Building[]>([]);
  const [, setSections] = useState<Section[]>([]);

  const facultyId = session?.facultyId || session?.id || 'fac-1';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [depts, subjs, rms, bldgs, secs, chgs, entries] = await Promise.all([
        apiService.getDepartments(),
        apiService.getSubjects(),
        apiService.getRooms(),
        apiService.getBuildings(),
        apiService.getSections(),
        apiService.getChanges().catch(() => []),
        apiService.getFacultySchedule(facultyId)
      ]);

      setDepartments(depts);
      setSubjects(subjs);
      setRooms(rms);
      setBuildings(bldgs);
      setSections(secs);
      setChanges(chgs);
      setTimetableEntries(entries);
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty schedule from backend API.');
    } finally {
      setIsLoading(false);
    }
  }, [facultyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getSubj = (id: string) => subjects.find(s => s.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);

  const currentMin = timeToMinutes(simulatedTime);

  // Today's classes for this faculty
  const todayClasses = timetableEntries
    .filter(e => e.day === selectedDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Ongoing class
  const currentClass = todayClasses.find(
    e => currentMin >= timeToMinutes(e.startTime) && currentMin < timeToMinutes(e.endTime)
  );

  // Next class
  const nextClass = todayClasses.find(e => timeToMinutes(e.startTime) > currentMin);

  // Remaining classes today
  const remainingClassesCount = todayClasses.filter(e => timeToMinutes(e.endTime) > currentMin).length;

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <h2 className="text-lg font-bold text-slate-800">Fetching Faculty Schedule from Backend...</h2>
        <p className="text-xs text-slate-500 font-mono">GET /api/timetables?facultyId={facultyId}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Backend API Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <h3 className="font-bold text-sm">Faculty Schedule API Connection Error</h3>
          </div>
          <p className="text-xs text-red-700 font-mono bg-white/70 p-2.5 rounded-lg border border-red-200 break-all">
            {error}
          </p>
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Request
          </button>
        </div>
      )}

      {/* Faculty Welcome Hero */}
      <div className="bg-gradient-to-r from-[#0F2942] via-[#142B4A] to-[#1E3A5F] text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-teal-200 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>Department of Computer Science & Engineering • Academic Year 2026-2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {session?.name || 'Dr. K. Radhakrishna'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Faculty ID: <strong className="font-mono text-white">{session?.identifier || 'VFSTR-FAC-101'}</strong> • Designation: <strong>Professor & Head</strong> • Cabin: Room A-205 (Vignan Bhavan)
            </p>
          </div>

          {/* Time simulation selector */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-bold text-teal-200 uppercase tracking-wider">
              Simulated Faculty Schedule Time
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value as DayOfWeek)}
                className="bg-slate-900/80 text-white border border-white/20 rounded-lg px-2.5 py-1 text-xs font-bold"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <input
                type="time"
                value={simulatedTime}
                onChange={e => { setTimeOverridden(true); setSimulatedTime(e.target.value); }}
                className="bg-slate-900/80 text-white border border-white/20 rounded-lg px-2 py-1 text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FACULTY AVAILABILITY TILES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Current Status ({simulatedTime})
          </span>
          {currentClass ? (
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-700">
                Currently Teaching
              </span>
              <p className="font-extrabold text-slate-900 text-sm mt-1">{getSubj(currentClass.subjectId)?.name || currentClass.subjectId}</p>
              <p className="text-xs text-blue-700 font-mono font-bold">Room {getRoom(currentClass.roomId)?.roomNumber || currentClass.roomId}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                Currently Free / Available
              </span>
              <p className="text-xs text-slate-600 mt-1">Available in Faculty Cabin A-205 for consultations.</p>
            </div>
          )}
        </div>

        {/* Next Available / Next class */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Next Available Slot
          </span>
          <p className="text-lg font-black text-emerald-700 font-mono">
            {currentClass ? currentClass.endTime : 'Available Now'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {nextClass ? `Free until ${nextClass.startTime}` : 'Free rest of the day'}
          </p>
        </div>

        {/* Upcoming class today */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Next Assigned Class
          </span>
          {nextClass ? (
            <div>
              <p className="font-bold text-slate-900 text-sm truncate">{getSubj(nextClass.subjectId)?.name || nextClass.subjectId}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {nextClass.startTime} • Room {getRoom(nextClass.roomId)?.roomNumber || nextClass.roomId}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No further classes scheduled for today.</p>
          )}
        </div>

        {/* Remaining load */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Remaining Today
          </span>
          <p className="text-2xl font-black text-[#142B4A] font-mono">
            {remainingClassesCount} <span className="text-xs font-normal text-slate-400">Classes</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total assigned today: {todayClasses.length} sessions
          </p>
        </div>
      </div>

      {/* TIMETABLE CHANGES ALERT */}
      {changes.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Academic Schedule Modifications</h3>
            </div>
            <Link to="/faculty/changes" className="text-xs font-bold text-blue-600 hover:underline">
              View All Changes &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {changes.slice(0, 2).map(ch => (
              <div key={ch.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">{ch.changeType}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Eff: {ch.effectiveDate}</span>
                </div>
                <p className="text-slate-700">
                  <span className="line-through text-slate-400 mr-2">{ch.previousValue}</span>
                  <strong className="text-blue-700">{ch.updatedValue}</strong>
                </p>
                <p className="text-[11px] text-slate-500 italic">Reason: {ch.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FACULTY TIMETABLE ROSTER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#142B4A]">
              My Assigned Teaching Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Department of Computer Science & Engineering • Academic Year 2026-2027
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'daily' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Daily Schedule
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'weekly' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Weekly Roster
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
              title="Print Schedule"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {timetableEntries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <h4 className="text-base font-bold text-slate-700">No Timetable Entries Found</h4>
            <p className="text-xs text-slate-400 mt-1">Backend returned 0 teaching assignments for faculty {facultyId}.</p>
          </div>
        ) : viewMode === 'daily' ? (
          <DailyTimetableList
            entries={timetableEntries}
            day={selectedDay}
            currentTime={simulatedTime}
          />
        ) : (
          <WeeklyTimetableGrid
            entries={timetableEntries}
            currentDay={selectedDay}
            currentTime={simulatedTime}
          />
        )}
      </div>
    </div>
  );
};
