import React, { useState } from 'react';
import { Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Building,
  Layers,
  Activity,
  Users,
  GraduationCap,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  FileSpreadsheet,
  History,
  DoorOpen,
  FlaskConical,
  BarChart3,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowLeftRight
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../hooks/useAuth';
import { BackendStatusBanner } from '../components/common/BackendStatusBanner';
import { GlobalSearchModal } from '../components/common/GlobalSearchModal';

interface DashboardLayoutProps {
  requiredRole?: 'admin' | 'faculty' | 'student';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ requiredRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { session, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fall back to the role the route was declared with, never to 'admin'.
  const role = session?.role || requiredRole || 'public';

  React.useEffect(() => {
    if (!sidebarOpen) return;
    const handleHardwareBack = (e: Event) => {
      e.preventDefault();
      setSidebarOpen(false);
    };
    window.addEventListener('campus_pulse_hardware_back', handleHardwareBack);
    return () => window.removeEventListener('campus_pulse_hardware_back', handleHardwareBack);
  }, [sidebarOpen]);

  // Navigation configurations based on role

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (!session) {
    const loginPath = requiredRole ? `/login/${requiredRole}` : '/login';
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && session.role !== requiredRole) {
    return <Navigate to={`/${session.role}/dashboard`} replace />;
  }

  // Admin-provisioned accounts must rotate their temporary password first.
  if (session.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  const getNavSections = () => {
    if (role === 'student') {
      return [
        {
          title: 'Student Portal',
          links: [
            { label: 'Dashboard Overview', path: '/student/dashboard', icon: LayoutDashboard },
            { label: 'My Timetable', path: '/student/timetable', icon: Calendar },
            { label: 'Search All Timetables', path: '/timetable', icon: Search },
            { label: 'Campus Explorer', path: '/campus', icon: Building },
            { label: 'Room Availability', path: '/availability', icon: Activity },
            { label: 'Notifications', path: '/student/notifications', icon: Bell },
            { label: 'My Profile', path: '/student/profile', icon: User },
          ]
        }
      ];
    }

    if (role === 'faculty') {
      return [
        {
          title: 'Faculty Portal',
          links: [
            { label: 'Dashboard Overview', path: '/faculty/dashboard', icon: LayoutDashboard },
            { label: 'My Assigned Timetable', path: '/faculty/timetable', icon: Calendar },
            { label: 'My Free Slot Availability', path: '/faculty/availability', icon: Activity },
            { label: 'Timetable Modifications', path: '/faculty/changes', icon: History },
            { label: 'Swap & Replace Periods', path: '/faculty/swap', icon: ArrowLeftRight },
            { label: 'Campus Explorer', path: '/campus', icon: Building },
            { label: 'Notifications', path: '/faculty/notifications', icon: Bell },
            { label: 'Faculty Profile', path: '/faculty/profile', icon: User },
          ]
        }
      ];
    }

    // Administrator Suite
    return [
      {
        title: 'Core Administration',
        links: [
          { label: 'Command Center', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Timetable Scheduling', path: '/admin/timetable', icon: Calendar },
          { label: 'Timetable Change Logs', path: '/admin/changes', icon: History },
          { label: 'Academic Years', path: '/admin/academic-years', icon: FileSpreadsheet },
          { label: 'Semesters', path: '/admin/semesters', icon: Layers },
          { label: 'Departments', path: '/admin/departments', icon: Building },
        ]
      },
      {
        title: 'Campus & Resources',
        links: [
          { label: 'Buildings Manager', path: '/admin/buildings', icon: Building },
          { label: 'Floors & Blueprints', path: '/admin/floors', icon: Layers },
          { label: 'Classrooms Manager', path: '/admin/classrooms', icon: DoorOpen },
          { label: 'Laboratories Manager', path: '/admin/laboratories', icon: FlaskConical },
          { label: 'Live Availability Roster', path: '/admin/availability', icon: Activity },
        ]
      },
      {
        title: 'People & Analytics',
        links: [
          { label: 'Faculty Roster', path: '/admin/faculty', icon: Users },
          { label: 'Student Directory', path: '/admin/students', icon: GraduationCap },
          { label: 'Utilization Reports', path: '/admin/reports', icon: BarChart3 },
          { label: 'System Settings', path: '/admin/settings', icon: Settings },
        ]
      }
    ];
  };

  const navSections = getNavSections();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB]">
      <BackendStatusBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-[#142B4A] text-slate-300 border-r border-slate-700/80 shrink-0">
          {/* Official University Branding at Top */}
          <div className="p-5 border-b border-slate-700/80 bg-[#0F1F38]">
            <Logo size="md" lightMode={true} showSubtitle={true} />
          </div>

          {/* User Profile Card */}
          <div className="p-4 mx-3 my-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
              {session?.name ? session.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'VF'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{session?.name || 'Administrator'}</p>
              <p className="text-[11px] text-blue-300 truncate font-mono">{session?.identifier || 'VFSTR Portal'}</p>
              <span className="inline-block mt-0.5 px-2 py-0.2 text-[9px] font-extrabold uppercase tracking-wide bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                {role}
              </span>
            </div>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
            {navSections.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {sec.title}
                </p>
                {sec.links.map(link => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Bottom Actions */}
          <div className="p-3 border-t border-slate-700/80 bg-[#0F1F38] space-y-1">
            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span>View Public Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold text-red-300 hover:text-red-100 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar for Dashboard */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-base font-extrabold text-[#142B4A] capitalize">
                  {role} Portal • Campus Pulse
                </h2>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Vignan's Foundation for Science, Technology and Research
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium border border-slate-200"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Search (Ctrl+K)</span>
              </button>

              <Link
                to="/"
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
              >
                Home View
              </Link>
            </div>
          </header>

          {/* Page Outlet */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-72 bg-[#142B4A] text-slate-300 flex flex-col h-full shadow-2xl">
            <div className="p-4 border-b border-slate-700/80 flex items-center justify-between bg-[#0F1F38]">
              <Logo size="sm" lightMode={true} showSubtitle={false} />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {navSections.map((sec, secIdx) => (
                <div key={secIdx} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {sec.title}
                  </p>
                  {sec.links.map(link => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-700/80 bg-[#0F1F38]">
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                  navigate('/login');
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

