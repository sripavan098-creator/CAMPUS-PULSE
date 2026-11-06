import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';
import { tokenStorage } from '../../services/tokenStorage';
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Shown to admin-provisioned accounts before they can reach the dashboard.
 * The backend refuses every other route until the temporary password is rotated.
 */
export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirm) {
      setError('The new password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      setDone(true);
      // Clear the flag locally so the layout stops gating this session. Write
      // through tokenStorage so the Capacitor path stays in sync too.
      if (session) {
        const updated = { ...session, mustChangePassword: false };
        await tokenStorage.setSession(updated);
        window.dispatchEvent(new Event('campus_pulse_auth_change'));
      }
      setTimeout(() => navigate(`/${session?.role || 'faculty'}/dashboard`), 1200);
    } catch (err: any) {
      const message = err?.data?.error?.message || err?.message || 'Could not change the password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="lg" showSubtitle={false} linkToHome={false} />
          </div>
          <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200">
            First-time setup
          </span>
          <h2 className="text-2xl font-extrabold text-[#142B4A]">Change your temporary password</h2>
          <p className="text-xs text-slate-500">
            Your account was created by an administrator. Set your own password to continue.
          </p>
        </div>

        {done ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-emerald-900">Password updated</p>
            <p className="text-xs text-emerald-800">Taking you to your dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            {error && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Temporary password</label>
              <input
                required
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">New password</label>
              <input
                required
                type="password"
                minLength={10}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="At least 10 characters"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Confirm new password</label>
              <input
                required
                type="password"
                minLength={10}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142B4A] text-white rounded-xl text-sm font-bold hover:bg-[#1d3a61] disabled:opacity-60"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
