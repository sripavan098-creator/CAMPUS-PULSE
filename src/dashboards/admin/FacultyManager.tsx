import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { Faculty, Department } from '../../types';
import { Mail, UserPlus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const FacultyManager: React.FC = () => {
  const { data: facultyList, loading, error, reload } = useApiResource<Faculty[]>(
    () => apiService.getFaculty(),
    []
  );
  const { data: departments } = useApiResource<Department[]>(() => apiService.getDepartments(), []);

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formDone, setFormDone] = useState('');

  const getDept = (id: string) => departments.find(d => d.id === id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setFormDone('');
    try {
      await apiService.createFaculty({ code, name, departmentId: departmentId || undefined, email, tempPassword });
      setFormDone(`Created ${name}. They must change the temporary password on first login.`);
      setCode(''); setName(''); setEmail(''); setTempPassword('');
      await reload();
    } catch (err: any) {
      setFormError(err?.data?.error?.message || err?.message || 'Could not create the faculty member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142B4A]">Faculty Member Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic teaching faculty, assigned course curriculums, contact parameters, and faculty research cabins.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#142B4A] text-white rounded-xl text-xs font-bold hover:bg-[#1d3a61]"
        >
          <UserPlus className="w-4 h-4" /> Add faculty
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {formError && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{formError}</span>
            </div>
          )}
          {formDone && (
            <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><span>{formDone}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Faculty code</label>
              <input required value={code} onChange={e => setCode(e.target.value)}
                placeholder="ACSE-FAC-07"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full name</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                placeholder="Dr. A. Professor"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Department</label>
              <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white">
                <option value="">Unassigned</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Login email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="faculty.name@vignan.ac.in"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Temporary password</label>
              <input required minLength={10} value={tempPassword} onChange={e => setTempPassword(e.target.value)}
                placeholder="At least 10 characters"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <p className="text-[11px] text-slate-400">The faculty member must change this on first login.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 disabled:opacity-60">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create faculty login
            </button>
          </div>
        </form>
      )}

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
