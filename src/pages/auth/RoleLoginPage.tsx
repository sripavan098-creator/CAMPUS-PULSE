import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';
import { DEMO_CREDENTIALS, demoCredentialsConfigured } from '../../services/authService';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  ArrowLeft,
  KeyRound,
  Sparkles,
  Info,
  AlertCircle
} from 'lucide-react';

interface RoleLoginPageProps {
  role: 'admin' | 'faculty' | 'student';
}

export const RoleLoginPage: React.FC<RoleLoginPageProps> = ({ role }) => {
  const credentials = DEMO_CREDENTIALS[role];
  const [email, setEmail] = useState(credentials.email);
  const [password, setPassword] = useState(credentials.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const roleMeta = {
    admin: {
      title: 'Administrator Login',
      badge: 'Academic Administration',
      icon: ShieldCheck,
      color: 'blue',
      redirect: '/admin/dashboard'
    },
    faculty: {
      title: 'Faculty Portal Login',
      badge: 'Academic Department Faculty',
      icon: UserCheck,
      color: 'teal',
      redirect: '/faculty/dashboard'
    },
    student: {
      title: 'Student Portal Login',
      badge: 'Student Academic Records',
      icon: GraduationCap,
      color: 'purple',
      redirect: '/student/dashboard'
    }
  }[role];

  const Icon = roleMeta.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      await login(email, role, password);
      navigate(roleMeta.redirect);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Could not authenticate with backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Top Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="lg" showSubtitle={false} linkToHome={true} />
          </div>
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">
            {roleMeta.badge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A]">
            {roleMeta.title}
          </h2>
          <p className="text-xs text-slate-500">
            Intelligent Timetable and Resource Scheduling System
          </p>
        </div>

        {/* Demo Fast-Login Notice Banner. Hidden when the deployment has not
            configured the seed credentials, because the values shown would fail. */}
        {demoCredentialsConfigured() && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Hackathon Demo Credentials
            </span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-bold text-blue-700 hover:underline"
            >
              Autofill Form
            </button>
          </div>
          <p className="text-slate-600 text-[11px]">
            Email: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">{credentials.email}</code>
            <br />
            Pass: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">{credentials.password}</code>
          </p>
        </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Failed</p>
                <p className="mt-0.5 text-red-600">{errorMessage}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Institutional Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@vignan.ac.in"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-semibold text-blue-600 hover:text-blue-800"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In as {role.toUpperCase()}</span>
                </>
              )}
            </button>
          </form>

          {role === 'student' && (
            <p className="mt-5 text-center text-xs text-slate-500">
              New student?{' '}
              <Link to="/signup/student" className="font-bold text-purple-700 hover:underline">
                Create your account
              </Link>
            </p>
          )}

          {/* Quick Switch to Other Roles */}
          <div className="pt-6 mt-6 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400 block mb-2">Switch access role:</span>
            <div className="flex justify-center gap-2 text-xs font-semibold">
              {role !== 'admin' && (
                <Link to="/login/admin" className="text-blue-600 hover:underline">
                  Admin
                </Link>
              )}
              {role !== 'faculty' && (
                <Link to="/login/faculty" className="text-teal-600 hover:underline">
                  Faculty
                </Link>
              )}
              {role !== 'student' && (
                <Link to="/login/student" className="text-purple-600 hover:underline">
                  Student
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Role Selection</span>
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Institutional Password Recovery</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              In this frontend demonstration mode, password reset requests are simulated. You can use the standard demo password <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">{credentials.password}</code> to sign in instantly.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

