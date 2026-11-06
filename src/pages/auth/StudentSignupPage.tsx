import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import { useLookups } from '../../hooks/useLookups';
import { GraduationCap, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export const StudentSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { sections } = useLookups();

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const sectionNames = sections.map(s => s.name).sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiService.signupStudent({ name, rollNumber, email, password, section });
      setDone(true);
      setTimeout(() => navigate('/login/student'), 1500);
    } catch (err: any) {
      const message = err?.data?.error?.message || err?.message || 'Signup failed.';
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
            <Logo size="lg" showSubtitle={false} linkToHome={true} />
          </div>
          <span className="inline-block px-3 py-1 bg-purple-50 text-purple-800 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-200">
            Student Registration
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A]">Create your student account</h2>
          <p className="text-xs text-slate-500">
            Pick your enrolled section so your personal timetable resolves automatically.
          </p>
        </div>

        {done ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-emerald-900">Account created</p>
            <p className="text-xs text-emerald-800">Redirecting you to the student login…</p>
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
              <label className="text-xs font-bold text-slate-700">Full name</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Rahul Sharma"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Roll number</label>
              <input
                required
                value={rollNumber}
                onChange={e => setRollNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="211FA04001"
              />
              <p className="text-[11px] text-slate-400">Format: batch + programme + serial, e.g. 211FA04001.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">College email</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="you@vignan.ac.in"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <input
                required
                type="password"
                minLength={10}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="At least 10 characters"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Section</label>
              <select
                required
                value={section}
                onChange={e => setSection(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Select your section…</option>
                {sectionNames.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142B4A] text-white rounded-xl text-sm font-bold hover:bg-[#1d3a61] disabled:opacity-60"
            >
              <GraduationCap className="w-4 h-4" />
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link to="/login/student" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to student login
          </Link>
        </div>
      </div>
    </div>
  );
};
