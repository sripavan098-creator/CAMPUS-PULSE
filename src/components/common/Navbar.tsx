import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  Calendar,
  Building,
  Activity,
  Users,
  Info,
  LogIn,
  LayoutDashboard,
  LogOut,
  Bell,
  Clock
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { session, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    apiService
      .getNotifications()
      .then(notifs => {
        if (!cancelled) setUnreadCount(notifs.filter(n => !n.isRead).length);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname, isAuthenticated]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleHardwareBack = (e: Event) => {
      e.preventDefault();
      setMobileMenuOpen(false);
    };
    window.addEventListener('campus_pulse_hardware_back', handleHardwareBack);
    return () => window.removeEventListener('campus_pulse_hardware_back', handleHardwareBack);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Home', path: '/', icon: Building },
    { label: 'Timetable', path: '/timetable', icon: Calendar },
    { label: 'Campus Explorer', path: '/campus', icon: Building },
    { label: 'Availability', path: '/availability', icon: Activity },
    { label: 'Faculty', path: '/availability?resourceType=faculty', icon: Users },
    { label: 'About', path: '/about', icon: Info },
  ];

  const getDashboardPath = () => {
    if (!session) return '/login';
    if (session.role === 'admin') return '/admin/dashboard';
    if (session.role === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Official Vignan Logo & Brand */}
          <Logo size="md" />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            {navLinks.map(link => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                    active
                      ? 'text-[#2563EB] bg-blue-50/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-medium border border-slate-200 transition-colors"
              title="Search campus (Ctrl + K)"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-300 text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Auth Actions */}
            {isAuthenticated && session ? (
              <div className="flex items-center gap-2">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#142B4A] hover:bg-[#1f3f6b] text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-300" />
                  <span className="hidden sm:inline capitalize">{session.role} Dashboard</span>
                  <span className="sm:hidden">Portal</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Login</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fadeIn">
          {navLinks.map(link => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'text-blue-700 bg-blue-50 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated && session ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#142B4A] text-white rounded-xl text-sm font-semibold"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-300" />
                  <span>Go to {session.role.toUpperCase()} Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-semibold"
              >
                <LogIn className="w-4 h-4" />
                <span>Institutional Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

