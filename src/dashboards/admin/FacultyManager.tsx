import React from 'react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { Faculty, Department } from '../../types';
import { Mail } from 'lucide-react';

export const FacultyManager: React.FC = () => {
  const { data: facultyList, loading, error } = useApiResource<Faculty[]>(
    () => apiService.getFaculty(),
    []
  );
  const { data: departments } = useApiResource<Department[]>(() => apiService.getDepartments(), []);

  const getDept = (id: string) => departments.find(d => d.id === id);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-[#142B4A]">Faculty Member Directory</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Academic teaching faculty, assigned course curriculums, contact parameters, and faculty research cabins.
        </p>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading faculty…</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Could not load faculty: {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facultyList.map(fac => {
          const dept = getDept(fac.departmentId);
          const initials = fac.name.split(' ').map(n => n[0]).join('').slice(0, 2);

          return (
            <div key={fac.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm shrink-0">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">{fac.name}</h3>
                    <p className="text-xs text-slate-500">{fac.designation}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="font-medium text-slate-800">
                    Department: <strong>{dept?.name || 'Department'}</strong>
                  </p>
                  {fac.email && (
                    <p className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{fac.email}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
