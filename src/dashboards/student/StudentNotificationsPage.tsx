import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { UserNotification } from '../../types';
import { Bell } from 'lucide-react';

export const StudentNotificationsPage: React.FC = () => {
  const { data: notifications, loading, error, reload } = useApiResource<UserNotification[]>(
    () => apiService.getNotifications(),
    []
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleMarkRead = async (id: string) => {
    setBusyId(id);
    try {
      await apiService.markNotificationRead(id);
      reload();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-[#142B4A]">Academic Notifications</h1>
        <p className="text-xs text-slate-500">Live alerts regarding timetable modifications, room changes, and department notices.</p>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading notifications…</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Could not load notifications: {error}
        </p>
      )}

      {!loading && notifications.length === 0 && (
        <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl">
          You have no notifications right now.
        </p>
      )}

      <div className="space-y-3">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-5 rounded-2xl border transition-all ${
              n.isRead ? 'bg-white border-slate-200 opacity-80' : 'bg-blue-50/60 border-blue-200 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${n.isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono block mt-2">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  disabled={busyId === n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shrink-0 disabled:opacity-50"
                >
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
