import React, { useMemo } from 'react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { Department, Room, TimetableEntry } from '../../types';
import { Printer } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export const AdminReportsPage: React.FC = () => {
  const { data: departments, loading: dLoading } = useApiResource<Department[]>(
    () => apiService.getDepartments(),
    []
  );
  const { data: rooms } = useApiResource<Room[]>(() => apiService.getRooms(), []);
  const { data: entries, loading: eLoading } = useApiResource<TimetableEntry[]>(
    () => apiService.getTimetables(),
    []
  );

  const loading = dLoading || eLoading;

  const metrics = useMemo(() => {
    const totalSlots = Math.max(1, rooms.length * 6 * 8);
    const labEntries = entries.filter(e => e.isLab).length;
    const weeklyLabHours = Math.round((labEntries * 50) / 60);
    const occupancy = Math.min(100, Math.round((entries.length / totalSlots) * 100));

    const byDept = new Map<string, number>();
    for (const e of entries) {
      if (!e.departmentId) continue;
      byDept.set(e.departmentId, (byDept.get(e.departmentId) ?? 0) + 1);
    }

    const deptUtilization = departments.map(d => ({
      name: d.code,
      scheduledPeriods: byDept.get(d.id) ?? 0,
      utilizationRate: Math.min(100, Math.round(((byDept.get(d.id) ?? 0) / totalSlots) * 100 * departments.length))
    }));

    return { totalSlots, weeklyLabHours, occupancy, deptUtilization };
  }, [departments, rooms, entries]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142B4A]">Spatial & Resource Utilization Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional academic metrics, room efficiency audits, and laboratory scheduling hours.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <Printer className="w-4 h-4" />
          <span>Print Audit Report</span>
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Computing live metrics…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Campus Occupancy</span>
          <p className="text-3xl font-extrabold text-blue-700 font-mono">{metrics.occupancy}%</p>
          <p className="text-xs text-slate-500 mt-1">Scheduled periods vs. total weekly room capacity.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Weekly Lab Hours</span>
          <p className="text-3xl font-extrabold text-teal-700 font-mono">{metrics.weeklyLabHours} Hrs</p>
          <p className="text-xs text-slate-500 mt-1">Total practical laboratory sessions across campus.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Scheduled Periods</span>
          <p className="text-3xl font-extrabold text-emerald-700 font-mono">{entries.length}</p>
          <p className="text-xs text-slate-500 mt-1">Published teaching periods in the current dataset.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#142B4A]">Departmental Scheduled Periods</h3>
          <p className="text-xs text-slate-500">Teaching periods allocated per academic department.</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.deptUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="scheduledPeriods" fill="#2563EB" name="Periods" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
