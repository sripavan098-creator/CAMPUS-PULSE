import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { RotateCcw, Download, Database, Check } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [reloadSuccess, setReloadSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleReload = () => {
    if (!confirm('Reload the live dataset from the server and clear any locally cached demo state?')) return;
    // The dashboards read straight from the API, but older sessions may still hold
    // bundled demo payloads under the campus_pulse_* keys. Clearing them guarantees
    // the UI shows server truth.
    Object.keys(localStorage)
      .filter(k => k.startsWith('campus_pulse_'))
      .forEach(k => localStorage.removeItem(k));
    setReloadSuccess(true);
    setTimeout(() => {
      setReloadSuccess(false);
      window.location.reload();
    }, 800);
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const [
        buildings, floors, rooms, departments, faculty,
        timetables, academicYears, semesters, sections, subjects
      ] = await Promise.all([
        apiService.getBuildings(),
        apiService.getFloors(),
        apiService.getRooms(),
        apiService.getDepartments(),
        apiService.getFaculty(),
        apiService.getTimetables(),
        apiService.getAcademicYears(),
        apiService.getSemesters(),
        apiService.getSections(),
        apiService.getSubjects()
      ]);

      const data = {
        buildings, floors, rooms, departments, faculty,
        timetables, academicYears, semesters, sections, subjects,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Vignan_Campus_Pulse_State_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export state');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-[#142B4A]">Platform Settings & Data Controls</h1>
        <p className="text-xs text-slate-500">Manage the live dataset connection, cached state, and system backups.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-slate-900">Reload Live Dataset</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Clears any locally cached state and re-fetches the current dataset from the backend API.
            </p>
          </div>

          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0"
          >
            {reloadSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Reloaded!</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Reload From Server</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">Export State (JSON)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Export the live server state (rooms, floors, blueprints, faculty, and timetable entries) as a JSON file.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{busy ? 'Exporting…' : 'Export Snapshot'}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2 text-xs text-slate-600">
          <h4 className="font-bold text-sm text-slate-900">Application Architecture Specification</h4>
          <p><strong>System Name:</strong> CAMPUS PULSE</p>
          <p><strong>Institution:</strong> Vignan's Foundation for Science, Technology and Research (Deemed to be University)</p>
          <p><strong>Tagline:</strong> One Campus. Every Schedule. Smarter Availability.</p>
          <p><strong>Frontend Stack:</strong> React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.</p>
          <p><strong>Backend:</strong> Express + Prisma REST API with token-authenticated role access.</p>
        </div>
      </div>
    </div>
  );
};
