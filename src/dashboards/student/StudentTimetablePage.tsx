import React, { useState } from 'react';
import { WeeklyTimetableGrid } from '../../components/timetable/WeeklyTimetableGrid';
import { DailyTimetableList } from '../../components/timetable/DailyTimetableList';
import { useAuth } from '../../hooks/useAuth';
import { timetableService } from '../../services/timetableService';
import { DAYS_OF_WEEK, campusNow } from '../../utils/timeUtils';
import { DayOfWeek } from '../../types';
import { Calendar, Printer, Download, Sparkles } from 'lucide-react';

export const StudentTimetablePage: React.FC = () => {
  const { session } = useAuth();
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [activeDay, setActiveDay] = useState<DayOfWeek>(campusNow().day);

  const sectionId = session?.sectionId || session?.group || 'sec-cse-3a';
  const entries = timetableService.getStudentSchedule(sectionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142B4A]">
            My Official Section Timetable
          </h1>
          <p className="text-xs text-slate-500">
            Assigned Section: <strong>CSE-3A</strong> • Academic Year 2026-2027 (Even Semester)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'weekly' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'daily' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Daily View
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {viewMode === 'daily' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {DAYS_OF_WEEK.map(d => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeDay === d
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'weekly' ? (
        <WeeklyTimetableGrid entries={entries} />
      ) : (
        <DailyTimetableList entries={entries} day={activeDay} />
      )}
    </div>
  );
};

