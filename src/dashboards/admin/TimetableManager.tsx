import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import {
  TimetableEntry,
  Section,
  Department,
  Subject,
  Faculty,
  Room,
  Building
} from '../../types';
import { TimetableEntryForm } from '../../components/timetable/TimetableEntryForm';
import { WeeklyTimetableGrid } from '../../components/timetable/WeeklyTimetableGrid';

export const TimetableManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec-cse-3a');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | undefined>(undefined);

  const [sections, setSections] = useState<Section[]>([]);
  const [, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tts, secs, depts, subjs, facs, rms, bldgs] = await Promise.all([
        apiService.getTimetables(),
        apiService.getSections(),
        apiService.getDepartments(),
        apiService.getSubjects(),
        apiService.getFaculty(),
        apiService.getRooms(),
        apiService.getBuildings()
      ]);

      setTimetables(tts);
      setSections(secs);
      setDepartments(depts);
      setSubjects(subjs);
      setFaculty(facs);
      setRooms(rms);
      setBuildings(bldgs);

      if (secs.length > 0 && !secs.some(s => s.id === selectedSectionId)) {
        setSelectedSectionId(secs[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load timetable management data from backend API');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSectionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getSubj = (id: string) => subjects.find(s => s.id === id);
  const getFac = (id: string) => faculty.find(f => f.id === id || f.name === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const getBldg = (id: string) => buildings.find(b => b.id === id);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this timetable entry from the production backend?')) {
      try {
        await apiService.deleteTimetableEntry(id);
        await loadData();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleDuplicate = async (entry: TimetableEntry) => {
    const duplicated: TimetableEntry = {
      ...entry,
      id: `tt-${Date.now()}`,
      day: entry.day === 'Monday' ? 'Tuesday' : 'Wednesday'
    };
    try {
      await apiService.addTimetableEntry(duplicated);
      await loadData();
    } catch (err: any) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const handleTogglePublish = async (entry: TimetableEntry) => {
    const updated: TimetableEntry = {
      ...entry,
      status: entry.status === 'published' ? 'draft' : 'published'
    };
    try {
      await apiService.updateTimetableEntry(updated);
      await loadData();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const filteredTimetables = timetables.filter(t => t.sectionId === selectedSectionId);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <h2 className="text-lg font-bold text-slate-800">Connecting to Backend Timetable Service...</h2>
        <p className="text-xs text-slate-500 font-mono">GET /api/timetables, /api/sections</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Backend API Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <h3 className="font-bold text-sm">Timetable API Sync Error</h3>
          </div>
          <p className="text-xs text-red-700 font-mono bg-white/70 p-2.5 rounded-lg border border-red-200 break-all">
            {error}
          </p>
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Sync
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142B4A]">Timetable Scheduling Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, duplicate, validate collisions, and publish official departmental schedules directly to the backend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingEntry(undefined);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Timetable Entry</span>
          </button>
        </div>
      </div>

      {/* Filter & View Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600">Select Section:</label>
          <select
            value={selectedSectionId}
            onChange={e => setSelectedSectionId(e.target.value)}
            className="p-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl"
          >
            {sections.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.totalStudents} students)</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Weekly Grid
            </button>
          </div>
        </div>
      </div>

      {/* Roster Display */}
      {viewMode === 'grid' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <WeeklyTimetableGrid entries={filteredTimetables} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Day</th>
                  <th className="py-3.5 px-4">Time Interval</th>
                  <th className="py-3.5 px-4">Subject Course</th>
                  <th className="py-3.5 px-4">Faculty</th>
                  <th className="py-3.5 px-4">Room & Building</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTimetables.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No timetable records returned by backend for section {selectedSectionId}.
                    </td>
                  </tr>
                ) : (
                  filteredTimetables.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{entry.day}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {entry.startTime} - {entry.endTime}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{getSubj(entry.subjectId)?.name || entry.subjectId}</span>
                        <span className="text-[10px] font-mono text-slate-400">{getSubj(entry.subjectId)?.code || ''}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {getFac(entry.facultyId)?.name || entry.facultyId}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-900">Room {getRoom(entry.roomId)?.roomNumber || entry.roomId}</span>
                        <span className="text-[10px] text-slate-400 block">{getBldg(entry.buildingId)?.name || ''}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          entry.isLab ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {entry.isLab ? 'Lab' : 'Theory'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleTogglePublish(entry)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                            entry.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {entry.status}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingEntry(entry);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(entry)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timetable Create/Edit Modal */}
      {isFormOpen && (
        <TimetableEntryForm
          initialData={editingEntry}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSaved={() => {
            setIsFormOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
