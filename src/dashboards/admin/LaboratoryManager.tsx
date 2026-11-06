import React from 'react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { Room, Building, Floor, Department } from '../../types';
import { MapPin, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LaboratoryManager: React.FC = () => {
  const { data: rooms, loading, error } = useApiResource<Room[]>(() => apiService.getRooms(), []);
  const { data: buildings } = useApiResource<Building[]>(() => apiService.getBuildings(), []);
  const { data: floors } = useApiResource<Floor[]>(() => apiService.getFloors(), []);
  const { data: departments } = useApiResource<Department[]>(() => apiService.getDepartments(), []);

  const labs = rooms.filter(r => r.type === 'laboratory');

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-[#142B4A]">Specialized Laboratories & Simulation Suites</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          High-performance computing, AI, CAD/CAM, VLSI, and robotics laboratories with equipment profiles.
        </p>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading laboratories…</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Could not load laboratories: {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {labs.map(lab => {
          const bldg = buildings.find(b => b.id === lab.buildingId);
          const flr = floors.find(f => f.id === lab.floorId);
          const dept = departments.find(d => d.id === lab.departmentId);

          return (
            <div key={lab.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-lg">
                    {lab.roomNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Capacity: <strong>{lab.capacity} Workstations</strong>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{lab.name}</h3>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5 font-medium text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{bldg?.name} ({bldg?.originalCode}){flr ? ` • ${flr.name}` : ''}</span>
                  </p>
                  {dept && <p>Department: <strong>{dept.name}</strong></p>}
                </div>

                {lab.equipment && lab.equipment.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-teal-600" /> Lab Infrastructure Specs
                    </span>
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5 font-mono text-[11px]">
                      {lab.equipment.map((eq, idx) => (
                        <li key={idx}>{eq}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {bldg && (
                  <Link
                    to={`/campus/${bldg.slug}?room=${lab.id}`}
                    className="font-bold text-teal-700 hover:underline"
                  >
                    View Blueprint Position &rarr;
                  </Link>
                )}
                <span className="font-mono text-slate-400 text-[10px]">ID: {lab.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
