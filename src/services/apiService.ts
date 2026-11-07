import { apiClient } from './apiClient';
import { tokenStorage } from './tokenStorage';
import {
  Building,
  Floor,
  Room,
  Department,
  AcademicYear,
  Semester,
  Section,
  Subject,
  Faculty,
  Student,
  TimetableEntry,
  TimetableChange,
  UserNotification,
  ScheduleRequest,
  FacultySummary,
  UserSession,
  Role,
  DayOfWeek
} from '../types';

export interface LoginResponse {
  token: string;
  user: UserSession;
  expiresIn?: number;
}

export const apiService = {
  // ==================== AUTHENTICATION ====================
  async login(credentials: { email: string; password?: string; role?: Role }): Promise<UserSession> {
    const res = await apiClient.post<LoginResponse>('/api/auth/login', credentials, {
      requiresAuth: false
    });

    if (res.token) {
      await tokenStorage.setToken(res.token);
    }
    const session: UserSession = {
      ...res.user,
      token: res.token
    };
    await tokenStorage.setSession(session);
    window.dispatchEvent(new Event('campus_pulse_auth_change'));
    return session;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', {}, { timeoutMs: 3000 });
    } catch {
      // Ignore network errors on logout
    }
    await tokenStorage.clearAll();
    window.dispatchEvent(new Event('campus_pulse_auth_change'));
  },

  async getCurrentSession(): Promise<UserSession | null> {
    const session = await tokenStorage.getSession();
    return session;
  },

  // ==================== CAMPUS BLOCKS & FLOORS ====================
  async getBuildings(): Promise<Building[]> {
    return apiClient.get<Building[]>('/api/buildings', { requiresAuth: false });
  },

  async getBuildingById(id: string): Promise<Building> {
    return apiClient.get<Building>(`/api/buildings/${id}`, { requiresAuth: false });
  },

  async getFloors(buildingId?: string): Promise<Floor[]> {
    const query = buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : '';
    return apiClient.get<Floor[]>(`/api/floors${query}`, { requiresAuth: false });
  },

  async getRooms(params?: { buildingId?: string; floorId?: string; type?: string }): Promise<Room[]> {
    const query = new URLSearchParams();
    if (params?.buildingId) query.append('buildingId', params.buildingId);
    if (params?.floorId) query.append('floorId', params.floorId);
    if (params?.type) query.append('type', params.type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<Room[]>(`/api/rooms${qs}`, { requiresAuth: false });
  },

  // ==================== TIMETABLES ====================
  async getTimetables(params?: {
    departmentId?: string;
    academicYearId?: string;
    semesterId?: string;
    sectionId?: string;
    facultyId?: string;
    day?: string;
  }): Promise<TimetableEntry[]> {
    const query = new URLSearchParams();
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.academicYearId) query.append('academicYearId', params.academicYearId);
    if (params?.semesterId) query.append('semesterId', params.semesterId);
    if (params?.sectionId) query.append('sectionId', params.sectionId);
    if (params?.facultyId) query.append('facultyId', params.facultyId);
    if (params?.day) query.append('day', params.day);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<TimetableEntry[]>(`/api/timetables${qs}`, { requiresAuth: false });
  },

  async getStudentSchedule(sectionId: string): Promise<TimetableEntry[]> {
    return apiClient.get<TimetableEntry[]>(`/api/timetables?sectionId=${encodeURIComponent(sectionId)}`, {
      requiresAuth: true
    });
  },

  async getFacultySchedule(facultyId: string): Promise<TimetableEntry[]> {
    return apiClient.get<TimetableEntry[]>(`/api/timetables?facultyId=${encodeURIComponent(facultyId)}`, {
      requiresAuth: true
    });
  },

  async addTimetableEntry(entry: Partial<TimetableEntry>): Promise<TimetableEntry> {
    return apiClient.post<TimetableEntry>('/api/timetables', entry);
  },

  async updateTimetableEntry(entry: TimetableEntry): Promise<TimetableEntry> {
    return apiClient.put<TimetableEntry>(`/api/timetables/${entry.id}`, entry);
  },

  async deleteTimetableEntry(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/timetables/${id}`);
  },

  // ==================== LIVE AVAILABILITY ====================
  async getAvailability(day: DayOfWeek, from: string, to: string, block?: string, type?: string): Promise<any[]> {
    const query = new URLSearchParams({ day, from, to });
    if (block) query.append('block', block);
    if (type) query.append('type', type);
    return apiClient.get<any[]>(`/api/availability/search?${query.toString()}`, { requiresAuth: false });
  },

  async getAvailabilityNow(): Promise<any> {
    return apiClient.get<any>('/api/availability/now', { requiresAuth: false });
  },

  // ==================== ACADEMIC STRUCTURE ====================
  async getDepartments(): Promise<Department[]> {
    return apiClient.get<Department[]>('/api/departments', { requiresAuth: false });
  },

  async getAcademicYears(): Promise<AcademicYear[]> {
    return apiClient.get<AcademicYear[]>('/api/academic-years', { requiresAuth: false });
  },

  async getSemesters(): Promise<Semester[]> {
    return apiClient.get<Semester[]>('/api/semesters', { requiresAuth: false });
  },

  async getSections(): Promise<Section[]> {
    return apiClient.get<Section[]>('/api/sections', { requiresAuth: false });
  },

  async getSubjects(): Promise<Subject[]> {
    return apiClient.get<Subject[]>('/api/subjects', { requiresAuth: false });
  },

  async getFaculty(): Promise<Faculty[]> {
    return apiClient.get<Faculty[]>('/api/faculty', { requiresAuth: false });
  },

  async getStudents(): Promise<Student[]> {
    return apiClient.get<Student[]>('/api/students', { requiresAuth: false });
  },

  async getChanges(): Promise<TimetableChange[]> {
    return apiClient.get<TimetableChange[]>('/api/changes', { requiresAuth: true });
  },

  async getNotifications(): Promise<UserNotification[]> {
    return apiClient.get<UserNotification[]>('/api/notifications', { requiresAuth: true });
  },

  async markNotificationRead(id: string): Promise<void> {
    await apiClient.post(`/api/me/notifications/${encodeURIComponent(id)}/read`, {});
  },

  async getFacultyChanges(): Promise<TimetableChange[]> {
    return apiClient.get<TimetableChange[]>('/api/faculty/me/changes', { requiresAuth: true });
  },

  async getFacultyTimetable(): Promise<TimetableEntry[]> {
    return apiClient.get<TimetableEntry[]>('/api/faculty/me/timetable', { requiresAuth: true });
  },

  async getAuditLog(): Promise<any[]> {
    return apiClient.get<any[]>('/api/admin/audit-log', { requiresAuth: true });
  },

  async getConflicts(): Promise<any> {
    return apiClient.get<any>('/api/admin/conflicts', { requiresAuth: true });
  },

  // ==================== ACCOUNTS ====================
  async signupStudent(payload: {
    name: string;
    rollNumber: string;
    email: string;
    password: string;
    section: string;
  }): Promise<UserSession> {
    const res = await apiClient.post<{ user: UserSession }>('/api/auth/signup/student', payload, {
      requiresAuth: false
    });
    return res.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/auth/change-password', { currentPassword, newPassword });
  },

  async createFaculty(payload: {
    code: string;
    name: string;
    departmentId?: string;
    email?: string;
    tempPassword?: string;
  }): Promise<{ faculty: any; user: any }> {
    return apiClient.post<{ faculty: any; user: any }>('/api/admin/faculty', payload);
  },

  // ==================== FACULTY SWAP & REPLACE ====================
  async getSwapCandidates(entryId: string): Promise<{ entry: TimetableEntry; candidates: any[] }> {
    return apiClient.get(`/api/faculty/me/swap-candidates?entryId=${encodeURIComponent(entryId)}`);
  },

  async getReplacementCandidates(entryId: string): Promise<{ entry: TimetableEntry; candidates: FacultySummary[] }> {
    return apiClient.get(`/api/faculty/me/replacement-candidates?entryId=${encodeURIComponent(entryId)}`);
  },

  async requestSwap(sourceEntryId: string, targetEntryId: string): Promise<ScheduleRequest> {
    const res = await apiClient.post<{ request: ScheduleRequest }>('/api/faculty/me/requests/swap', {
      sourceEntryId,
      targetEntryId
    });
    return res.request;
  },

  async requestReplace(sourceEntryId: string, substituteFacultyId: string, reason?: string): Promise<ScheduleRequest> {
    const res = await apiClient.post<{ request: ScheduleRequest }>('/api/faculty/me/requests/replace', {
      sourceEntryId,
      substituteFacultyId,
      reason
    });
    return res.request;
  },

  async getScheduleRequests(): Promise<{ incoming: ScheduleRequest[]; outgoing: ScheduleRequest[] }> {
    return apiClient.get('/api/faculty/me/requests');
  },

  async decideScheduleRequest(id: string, decision: 'accept' | 'reject'): Promise<ScheduleRequest> {
    const res = await apiClient.post<{ request: ScheduleRequest }>(
      `/api/faculty/me/requests/${encodeURIComponent(id)}/${decision}`,
      {}
    );
    return res.request;
  },

  // ==================== ADMIN: SCHEDULE REQUESTS ====================
  async getAdminScheduleRequests(status?: string): Promise<{ requests: ScheduleRequest[]; total: number }> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient.get(`/api/admin/schedule-requests${query}`);
  },

  async overrideScheduleRequest(id: string, decision: 'accept' | 'reject'): Promise<ScheduleRequest> {
    const res = await apiClient.post<{ request: ScheduleRequest }>(
      `/api/admin/schedule-requests/${encodeURIComponent(id)}/override`,
      { decision }
    );
    return res.request;
  },

  // ==================== ADMIN CRUD ====================
  // The REST layer names the owning building `blockId` while the SPA type calls
  // it `buildingId`; accept the raw payload so callers can send either.
  async createRoom(room: Record<string, unknown>): Promise<any> {
    return apiClient.post('/api/admin/rooms', room);
  },

  async updateRoom(id: string, room: Record<string, unknown>): Promise<any> {
    return apiClient.put(`/api/admin/rooms/${encodeURIComponent(id)}`, room);
  },

  async deleteRoom(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/rooms/${encodeURIComponent(id)}`);
  },

  async createAcademicYear(year: { yearName: string; startDate: string; endDate: string }): Promise<AcademicYear> {
    return apiClient.post<AcademicYear>('/api/academic-years', year);
  },

  async updateAcademicYear(id: string, patch: Partial<AcademicYear>): Promise<AcademicYear> {
    return apiClient.put<AcademicYear>(`/api/academic-years/${encodeURIComponent(id)}`, patch);
  },

  async activateAcademicYear(id: string): Promise<AcademicYear> {
    return apiClient.put<AcademicYear>(`/api/academic-years/${encodeURIComponent(id)}`, {
      isActive: true,
      isArchived: false
    });
  },

  async activateSemester(id: string): Promise<Semester> {
    return apiClient.put<Semester>(`/api/semesters/${encodeURIComponent(id)}`, { isActive: true });
  }
};
