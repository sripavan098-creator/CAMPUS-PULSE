import { Role, UserSession } from '../types';
import { apiService } from './apiService';

const SESSION_KEY = 'cp_user_session';

// The demo accounts are created by prisma/seed.ts, which reads the addresses and
// passwords from ADMIN_/FACULTY_/STUDENT_SEED_* environment variables. The login
// page shows whatever this resolves to, so a deployment only has to configure the
// VITE_* twins of those variables (or the *_SEED_* ones) to keep the advertised
// credentials working; no password is hard-coded in the bundle.
const envValue = (...names: string[]): string => {
  const env = (import.meta.env ?? {}) as Record<string, string | undefined>;
  for (const name of names) {
    const value = env[name];
    if (value) return value;
  }
  return '';
};

export const DEMO_CREDENTIALS = {
  admin: {
    email: envValue('VITE_ADMIN_SEED_EMAIL', 'ADMIN_SEED_EMAIL'),
    password: envValue('VITE_ADMIN_SEED_PASSWORD', 'ADMIN_SEED_PASSWORD'),
    role: 'admin' as Role,
    name: 'Administrator (HOD)',
    identifier: 'VFSTR-ADMIN-01',
    departmentId: 'All'
  },
  faculty: {
    email: envValue('VITE_FACULTY_SEED_EMAIL', 'FACULTY_SEED_EMAIL'),
    password: envValue('VITE_FACULTY_SEED_PASSWORD', 'FACULTY_SEED_PASSWORD'),
    role: 'faculty' as Role,
    name: 'Dr. S. Vinoth',
    identifier: 'VFSTR-FAC-101',
    departmentId: 'dept-cse'
  },
  student: {
    email: envValue('VITE_STUDENT_SEED_EMAIL', 'STUDENT_SEED_EMAIL'),
    password: envValue('VITE_STUDENT_SEED_PASSWORD', 'STUDENT_SEED_PASSWORD'),
    role: 'student' as Role,
    name: 'Pavan (Student Representative)',
    identifier: '211FA04001',
    departmentId: 'dept-cse',
    sectionId: 'sec-cse-3a'
  }
};

export const demoCredentialsConfigured = (): boolean =>
  Boolean(DEMO_CREDENTIALS.admin.email && DEMO_CREDENTIALS.faculty.email && DEMO_CREDENTIALS.student.email);

export const authService = {
  getCurrentSession(): UserSession | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as UserSession;
    } catch {
      return null;
    }
  },

  async login(email: string, role: Role, password?: string): Promise<UserSession> {
    // Authenticate directly with the production backend
    return await apiService.login({ email, password, role });
  },

  async logout(): Promise<void> {
    await apiService.logout();
  },

  isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }
};
