import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/apiService';
import { ScheduleRequest } from '../../types';
import { ArrowLeftRight, UserMinus, Check, X, RefreshCw, Loader2 } from 'lucide-react';

const DAY_LABEL: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday'
};

function slotLabel(entry?: any) {
  if (!entry) return '—';
  return `${DAY_LABEL[entry.day] || entry.day} ${entry.startTime}–${entry.endTime}`;
}

/**
 * Admin oversight of faculty swap/replace requests: see every request and
 * force a decision when the counterpart is unresponsive.
 */
export const AdminScheduleRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getAdminScheduleRequests(status || undefined);
      setRequests(res.requests);
    } catch (err: any) {
      setError(err?.message || 'Could not load schedule requests.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const override = async (id: string, decision: 'accept' | 'reject') => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await apiService.overrideScheduleRequest(id, decision);
      setNotice(decision === 'accept' ? 'Request accepted and applied.' : 'Request rejected.');
      await load();
    } catch (err: any) {
      setError(err?.data?.error?.message || err?.message || 'Could not apply the override.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142B4A]">Faculty Swap &amp; Replace Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversight of period trades and substitutions. Override a pending request when needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
          >
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {notice && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{notice}</p>}

      {loading ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl">No requests in this view.</p>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    req.type === 'swap' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {req.type === 'swap' ? <ArrowLeftRight className="w-3 h-3" /> : <UserMinus className="w-3 h-3" />}
                    {req.type}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800'
                    : req.status === 'rejected' ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-800'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {req.requester?.name || 'Faculty'}
                  {req.type === 'swap'
                    ? ` ⇄ ${req.targetFaculty?.name || 'Faculty'}`
                    : ` → ${req.sourceEntry?.subject || 'period'}`}
                </p>
                <p className="text-xs text-slate-500">
                  {req.type === 'swap'
                    ? `${slotLabel(req.sourceEntry)} for ${slotLabel(req.targetEntry)}`
                    : `Releases ${slotLabel(req.sourceEntry)}`}
                </p>
                {req.reason && <p className="text-xs text-slate-500 italic">Reason: {req.reason}</p>}
              </div>

              {req.status === 'pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={busyId === req.id}
                    onClick={() => override(req.id, 'accept')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busyId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Force accept
                  </button>
                  <button
                    disabled={busyId === req.id}
                    onClick={() => override(req.id, 'reject')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-300 text-red-700 rounded-xl text-xs font-bold hover:bg-red-50 disabled:opacity-60"
                  >
                    <X className="w-3.5 h-3.5" /> Force reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
