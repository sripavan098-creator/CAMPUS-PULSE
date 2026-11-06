import React from 'react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { Building } from '../../types';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BuildingManager: React.FC = () => {
  const { data: buildings, loading, error } = useApiResource<Building[]>(
    () => apiService.getBuildings(),
    []
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-[#142B4A]">Campus Blocks & Buildings Registry</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Primary university buildings mapped with exact campus photography and registered floor hierarchies.
        </p>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading buildings…</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Could not load buildings: {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.map(bldg => (
          <div key={bldg.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
            <div className="relative h-44 bg-slate-100 overflow-hidden">
              <img src={bldg.imageUrl} alt={bldg.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-white font-mono font-bold text-xs px-2.5 py-0.5 rounded shadow">
                {bldg.originalCode}
              </div>
            </div>

            <div className="p-5 space-y-2">
              <h3 className="font-bold text-base text-slate-900">{bldg.name}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{bldg.description}</p>
              <div className="text-xs text-slate-500 pt-1">
                <span>Floors: <strong>{bldg.totalFloors}</strong></span> •{' '}
                <span>Departments: <strong>{bldg.departments.join(', ')}</strong></span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link to={`/campus/${bldg.slug}`} className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                <span>Inspect Blueprints</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-slate-400 font-mono text-[11px]">ID: {bldg.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
