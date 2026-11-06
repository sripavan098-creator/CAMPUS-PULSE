import React from 'react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { Department, Building } from '../../types';

export const DepartmentManager: React.FC = () => {
  const { data: departments, loading, error } = useApiResource<Department[]>(
    () => apiService.getDepartments(),
    []
  );
  const { data: buildings } = useApiResource<Building[]>(() => apiService.getBuildings(), []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-[#142B4A]">Academic Department Roster</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Participating academic departments, head of department allocations, and building headquarters.
        </p>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading departments…</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Could not load departments: {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(d => {
          const bldg = buildings.find(b => b.id === d.buildingId);

          return (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                    {d.code}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Headquarters: {bldg?.originalCode || 'HQ'}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{d.name}</h3>
                <p className="text-xs text-slate-600">
                  Head of Department: <strong>{d.headOfDepartment}</strong>
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Faculty</span>
                  <span className="font-extrabold text-slate-800 text-sm">{d.totalFaculty}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Students</span>
                  <span className="font-extrabold text-blue-700 text-sm">{d.totalStudents}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
