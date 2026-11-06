import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { Semester } from '../../types';
import { CheckCircle2 } from 'lucide-react';

export const SemesterManager: React.FC = () => {
  const { data: semesters, loading, error, reload } = useApiResource<Semester[]>(
    () => apiService.getSemesters(),
    []
  );
  const [busy, setBusy] = useState(false);

  const handleSetActive = async (id: string) => {
    setBusy(true);
    try {
      await apiService.activateSemester(id);
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-[#142B4A]">Semester Academic Structure</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage odd/even semester cycle definitions and published schedule activation status.
        </p>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading semesters…</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Could not load semesters: {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {semesters.map(s => (
          <div
            key={s.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
              s.isActive ? 'border-teal-400 ring-2 ring-teal-500/20' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-slate-900">{s.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  s.isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {s.isActive ? 'Currently Active' : 'Upcoming'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {s.startDate && s.endDate ? <>Duration: {s.startDate} to {s.endDate} • </> : null}
                Type: <strong>{s.type} Semester</strong>
              </p>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">ID: {s.id}</span>
              {!s.isActive ? (
                <button
                  disabled={busy}
                  onClick={() => handleSetActive(s.id)}
                  className="font-bold text-blue-600 hover:underline disabled:opacity-50"
                >
                  Activate Semester
                </button>
              ) : (
                <span className="text-teal-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Active Semester
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
