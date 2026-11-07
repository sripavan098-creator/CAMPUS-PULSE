import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Printer,
  Download,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { apiService } from '../services/apiService';
import {
  Department,
  AcademicYear,
  Semester,
  Section,
  Subject,
  Faculty,
  Room,
  TimetableEntry,
  DayOfWeek
} from '../types';
import { WeeklyTimetableGrid } from '../components/timetable/WeeklyTimetableGrid';
import { DailyTimetableList } from '../components/timetable/DailyTimetableList';
import { DAYS_OF_WEEK, selectBellEntries } from '../utils/timeUtils';

export const PublicTimetablePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Selection form
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedSemId, setSelectedSemId] = useState('');
  const [selectedYearOfStudy, setSelectedYearOfStudy] = useState<number>(3);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Results & View
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  // Times drawn even when this section is free, so its day is not cut short.
  const [bellEntries, setBellEntries] = useState<TimetableEntry[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [depts, ays, sems, secs, subjs, facs, rms] = await Promise.all([
        apiService.getDepartments(),
        apiService.getAcademicYears(),
        apiService.getSemesters(),
        apiService.getSections(),
        apiService.getSubjects(),
        apiService.getFaculty(),
        apiService.getRooms()
      ]);

      setDepartments(depts);
      setAcademicYears(ays);
      setSemesters(sems);
      setSections(secs);
      setSubjects(subjs);
      setFaculty(facs);
      setRooms(rms);

      // Initial default values
      const defaultDept = depts[0]?.id || '';
      const defaultAy = ays.find(y => y.isActive)?.id || ays[0]?.id || '';
      const defaultSem = sems.find(s => s.isActive)?.id || sems[0]?.id || '';
      const defaultSec = secs.find(s => s.departmentId === defaultDept)?.id || secs[0]?.id || '';

      setSelectedDeptId(defaultDept);
      setSelectedYearId(defaultAy);
      setSelectedSemId(defaultSem);
      setSelectedSectionId(defaultSec);

      // Auto-load default section schedule from backend
      if (defaultSec) {
        try {
          const [entries, deptEntries] = await Promise.all([
            apiService.getTimetables({ sectionId: defaultSec }),
            apiService.getTimetables({ departmentId: defaultDept })
          ]);
          setTimetableEntries(entries);
          setBellEntries(selectBellEntries(deptEntries, defaultSec, entries));
          setHasQueried(true);
        } catch {
          // If timetable lookup fails, keep entries empty
          setTimetableEntries([]);
          setHasQueried(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load academic timetable metadata from backend API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const filteredSections = sections.filter(
    s => s.departmentId === selectedDeptId && s.yearOfStudy === Number(selectedYearOfStudy)
  );

  const handleQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSectionId) return;

    setIsQuerying(true);
    setError(null);
    try {
      const [entries, deptEntries] = await Promise.all([
        apiService.getTimetables({ sectionId: selectedSectionId }),
        apiService.getTimetables({ departmentId: selectedDeptId })
      ]);
      setTimetableEntries(entries);
      setBellEntries(selectBellEntries(deptEntries, selectedSectionId, entries));
      setHasQueried(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch timetable for the selected section.');
    } finally {
      setIsQuerying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (timetableEntries.length === 0) return;

    const headers = ['Day', 'Start Time', 'End Time', 'Subject Code', 'Subject Name', 'Faculty', 'Room', 'Type'];
    const rows = timetableEntries.map(entry => [
      entry.day,
      entry.startTime,
      entry.endTime,
      subjects.find(s => s.id === entry.subjectId)?.code || '',
      subjects.find(s => s.id === entry.subjectId)?.name || '',
      faculty.find(f => f.id === entry.facultyId)?.name || '',
      rooms.find(r => r.id === entry.roomId)?.roomNumber || '',
      entry.isLab ? 'Lab' : 'Theory'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vignan_Timetable_${selectedSectionId}.csv`);
    link.click();
  };

  const activeSectionObj = sections.find(s => s.id === selectedSectionId);
  const activeDeptObj = departments.find(d => d.id === selectedDeptId);
  const activeSemObj = semesters.find(s => s.id === selectedSemId);
  const activeAyObj = academicYears.find(y => y.id === selectedYearId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <h2 className="text-lg font-bold text-slate-800">Connecting to Backend Timetable API...</h2>
        <p className="text-xs text-slate-500 font-mono">GET /api/departments, /api/sections, /api/timetables</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
            <Calendar className="w-4 h-4" />
            <span>Public Timetable Search • Backend API Connected</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#142B4A] mt-1">
            Academic Schedule Finder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Students and visitors can search, view, and print complete published academic schedules retrieved directly from the backend.
          </p>
        </div>

        {hasQueried && timetableEntries.length > 0 && (
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Schedule</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Backend Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <h3 className="font-bold text-sm">Timetable API Connection Failed</h3>
          </div>
          <p className="text-xs text-red-700 font-mono bg-white/70 p-2.5 rounded-lg border border-red-200 break-all">
            {error}
          </p>
          <button
            onClick={() => loadInitialData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Request
          </button>
        </div>
      )}

      {/* FILTER SEARCH FORM (PRINT HIDDEN) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print:hidden">
        <form onSubmit={handleQuery} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Department */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                1. Department
              </label>
              <select
                value={selectedDeptId}
                onChange={e => {
                  setSelectedDeptId(e.target.value);
                  const firstSec = sections.find(s => s.departmentId === e.target.value);
                  if (firstSec) setSelectedSectionId(firstSec.id);
                }}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* 2. Academic Year */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                2. Academic Year
              </label>
              <select
                value={selectedYearId}
                onChange={e => setSelectedYearId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              >
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.id}>{ay.yearName} {ay.isActive ? '(Active)' : ''}</option>
                ))}
              </select>
            </div>

            {/* 3. Semester */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                3. Semester
              </label>
              <select
                value={selectedSemId}
                onChange={e => setSelectedSemId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              >
                {semesters.map(sem => (
                  <option key={sem.id} value={sem.id}>{sem.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Year of Study */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                4. Year of Study
              </label>
              <select
                value={selectedYearOfStudy}
                onChange={e => {
                  const val = Number(e.target.value);
                  setSelectedYearOfStudy(val);
                  const firstMatch = sections.find(s => s.departmentId === selectedDeptId && s.yearOfStudy === val);
                  if (firstMatch) setSelectedSectionId(firstMatch.id);
                }}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1st Year (Freshman)</option>
                <option value={2}>2nd Year (Sophomore)</option>
                <option value={3}>3rd Year (Junior)</option>
                <option value={4}>4th Year (Senior)</option>
              </select>
            </div>

            {/* 5. Section */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                5. Section
              </label>
              <select
                value={selectedSectionId}
                onChange={e => setSelectedSectionId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500"
              >
                {filteredSections.length === 0 ? (
                  <option value="">No sections found</option>
                ) : (
                  filteredSections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name} ({sec.totalStudents} students)</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Querying schedule directly from backend API
            </span>

            <button
              type="submit"
              disabled={isQuerying}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {isQuerying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isQuerying ? 'Fetching...' : 'View Timetable'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RESULTS DISPLAY */}
      {hasQueried && (
        <div className="space-y-6">
          {/* Active Timetable Header Banner */}
          <div className="bg-[#142B4A] text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-widest">
                Official Department Timetable
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold">
                {activeDeptObj?.name || 'Department'} • Section {activeSectionObj?.name || 'A'}
              </h2>
              <p className="text-xs text-blue-200">
                Academic Year: {activeAyObj?.yearName || '2026-2027'} • {activeSemObj?.name || 'Semester VI'} • Total Strength: {activeSectionObj?.totalStudents || 65}
              </p>
            </div>

            {/* View Mode Toggle (Weekly vs Daily) */}
            <div className="flex items-center gap-3 print:hidden">
              <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/20">
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'weekly' ? 'bg-white text-[#142B4A] shadow-sm' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Weekly Grid
                </button>
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'daily' ? 'bg-white text-[#142B4A] shadow-sm' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Daily Timeline
                </button>
              </div>
            </div>
          </div>

          {/* If daily mode, day selector bar */}
          {viewMode === 'daily' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
              {DAYS_OF_WEEK.map(d => (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeDay === d
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Timetable Views */}
          {timetableEntries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <h4 className="text-base font-bold text-slate-700">No Timetable Published for this Section Yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No schedule entries were returned from the backend for this section in the active semester.
              </p>
            </div>
          ) : viewMode === 'weekly' ? (
            <WeeklyTimetableGrid entries={timetableEntries} bellEntries={bellEntries} />
          ) : (
            <DailyTimetableList entries={timetableEntries} day={activeDay} />
          )}
        </div>
      )}
    </div>
  );
};
