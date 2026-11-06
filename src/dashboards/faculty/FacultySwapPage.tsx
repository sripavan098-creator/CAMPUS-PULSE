import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/apiService';
import { TimetableEntry, ScheduleRequest, FacultySummary } from '../../types';
import { ArrowLeftRight, UserMinus, Check, X, Loader2, RefreshCw, Inbox } from 'lucide-react';

const DAY_LABEL: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday'
};

function slotLabel(entry?: TimetableEntry | null) {
  if (!entry) return '—';
  return `${DAY_LABEL[entry.day] || entry.day} ${entry.startTime}–${entry.endTime}`;
}

/**
 * Faculty swap and replace: raise a request from one of your own periods, or
 * accept/reject a request aimed at you.
 */
export const FacultySwapPage: React.FC = () => {
  const [myEntries, setMyEntries] = useState<TimetableEntry[]>([]);
  const [incoming, setIncoming] = useState<ScheduleRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ScheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal state for raising a request.
  const [mode, setMode] = useState<'swap' | 'replace' | null>(null);
  const [sourceEntry, setSourceEntry] = useState<TimetableEntry | null>(null);
  const [swapTargets, setSwapTargets] = useState<any[]>([]);
  const [replacements, setReplacements] = useState<FacultySummary[]>([]);
  const [chosen, setChosen] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entries, requests] = await Promise.all([
        apiService.getFacultyTimetable(),
        apiService.getScheduleRequests()
      ]);
      setMyEntries(entries);
      setIncoming(requests.incoming);
      setOutgoing(requests.outgoing);
    } catch (err: any) {
      setError(err?.message || 'Could not load swap and replace data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openSwap = async (entry: TimetableEntry) => {
    setMode('swap');
    setSourceEntry(entry);
    setChosen('');
    setReason('');
    setSwapTargets([]);
    try {
      const res = await apiService.getSwapCandidates(entry.id);
      setSwapTargets(res.candidates);
    } catch (err: any) {
      setError(err?.message || 'Could not load swap candidates.');
    }
  };

  const openReplace = async (entry: TimetableEntry) => {
    setMode('replace');
    setSourceEntry(entry);
    setChosen('');
    setReason('');
    setReplacements([]);
    try {
      const res = await apiService.getReplacementCandidates(entry.id);
      setReplacements(res.candidates);
    } catch (err: any) {
      setError(err?.message || 'Could not load replacement candidates.');
    }
  };

  const submit = async () => {
    if (!sourceEntry || !chosen) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'swap') {
        await apiService.requestSwap(sourceEntry.id, chosen);
      } else {
        await apiService.requestReplace(sourceEntry.id, chosen, reason || undefined);
      }
      setNotice('Request sent. The other faculty member will see it in their inbox.');
      setMode(null);
      await load();
    } catch (err: any) {
      setError(err?.data?.error?.message || err?.message || 'Could not send the request.');
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id: string, decision: 'accept' | 'reject') => {
    setBusy(true);
    setError(null);
    try {
      await apiService.decideScheduleRequest(id, decision);
      setNotice(decision === 'accept' ? 'Request accepted. The timetable was updated.' : 'Request rejected.');
      await load();
    } catch (err: any) {
      setError(err?.data?.error?.message || err?.message || 'Could not record your decision.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142B4A]">Swap &amp; Replace Periods</h1>
          <p className="text-xs text-slate-500">
            Trade a period with a colleague, or hand one to a free faculty member who teaches the same section.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {notice && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{notice}</p>
      )}

      {/* Incoming requests */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
          <Inbox className="w-4 h-4 text-blue-600" /> Requests awaiting your decision
        </h2>
        {loading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : incoming.length === 0 ? (
          <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl">No pending requests.</p>
        ) : (
          incoming.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${req.type === 'swap' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                  {req.type}
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {req.requester?.name || 'A colleague'} asks you to{' '}
                  {req.type === 'swap' ? 'swap a period' : 'cover a period'}
                </p>
                <p className="text-xs text-slate-500">
                  {req.type === 'swap'
                    ? `Their ${slotLabel(req.sourceEntry)} for your ${slotLabel(req.targetEntry)}`
                    : `Their ${slotLabel(req.sourceEntry)}${req.sourceEntry?.subject ? ` (${req.sourceEntry.subject})` : ''}`}
                </p>
                {req.reason && <p className="text-xs text-slate-500 italic">Reason: {req.reason}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={busy}
                  onClick={() => decide(req.id, 'accept')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
                <button
                  disabled={busy}
                  onClick={() => decide(req.id, 'reject')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-300 text-red-700 rounded-xl text-xs font-bold hover:bg-red-50 disabled:opacity-60"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* My periods */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-800">My periods</h2>
        {loading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : myEntries.length === 0 ? (
          <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl">No periods assigned to you.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myEntries.map(entry => (
              <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{entry.subject || 'Class'}</p>
                  <p className="text-xs text-slate-500">
                    {slotLabel(entry)} • {entry.roomId || 'No room'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openSwap(entry)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
                  </button>
                  <button
                    onClick={() => openReplace(entry)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Replace
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Outgoing requests */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-800">Requests you raised</h2>
        {outgoing.length === 0 ? (
          <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl">You have not raised any requests.</p>
        ) : (
          outgoing.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${req.type === 'swap' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                  {req.type}
                </span>
                <p className="text-slate-700 mt-1">
                  {slotLabel(req.sourceEntry)} → {req.targetFaculty?.name || 'colleague'}
                </p>
              </div>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full ${
                req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800'
                : req.status === 'rejected' ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-800'
              }`}>
                {req.status}
              </span>
            </div>
          ))
        )}
      </section>

      {/* Raise-request modal */}
      {mode && sourceEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#142B4A]">
                {mode === 'swap' ? 'Request a swap' : 'Request a replacement'}
              </h3>
              <button onClick={() => setMode(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Your period: <strong>{sourceEntry.subject || 'Class'}</strong> ({slotLabel(sourceEntry)})
            </p>

            {mode === 'swap' ? (
              swapTargets.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                  No same-section periods available to swap with.
                </p>
              ) : (
                <select
                  value={chosen}
                  onChange={e => setChosen(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  <option value="">Choose a period to trade for…</option>
                  {swapTargets.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.faculty?.name || 'Faculty'} — {slotLabel(t)} — {t.subject || 'Class'}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <>
                {replacements.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                    No free same-section faculty are available for this slot.
                  </p>
                ) : (
                  <select
                    value={chosen}
                    onChange={e => setChosen(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">Choose a substitute…</option>
                    {replacements.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                    ))}
                  </select>
                )}
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMode(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={!chosen || busy}
                onClick={submit}
                className="flex items-center gap-2 px-4 py-2 bg-[#142B4A] text-white rounded-xl text-xs font-bold hover:bg-[#1d3a61] disabled:opacity-60"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
