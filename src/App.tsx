import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMobileApp } from './hooks/useMobileApp';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { HomePage } from './pages/HomePage';
import { CampusExplorerPage } from './pages/CampusExplorerPage';
import { BuildingDetailPage } from './pages/BuildingDetailPage';
import { PublicTimetablePage } from './pages/PublicTimetablePage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Auth Pages
import { RoleSelectLoginPage } from './pages/auth/RoleSelectLoginPage';
import { RoleLoginPage } from './pages/auth/RoleLoginPage';
import { StudentSignupPage } from './pages/auth/StudentSignupPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';

// Student Pages
import { StudentDashboard } from './dashboards/student/StudentDashboard';
import { StudentTimetablePage } from './dashboards/student/StudentTimetablePage';
import { StudentProfilePage } from './dashboards/student/StudentProfilePage';
import { StudentNotificationsPage } from './dashboards/student/StudentNotificationsPage';

// Faculty Pages
import { FacultyDashboard } from './dashboards/faculty/FacultyDashboard';
import { FacultyAvailabilityPage } from './dashboards/faculty/FacultyAvailabilityPage';
import { FacultyChangesPage } from './dashboards/faculty/FacultyChangesPage';
import { FacultySwapPage } from './dashboards/faculty/FacultySwapPage';

// Admin Pages
import { AdminDashboard } from './dashboards/admin/AdminDashboard';
import { TimetableManager } from './dashboards/admin/TimetableManager';
import { AcademicYearManager } from './dashboards/admin/AcademicYearManager';
import { SemesterManager } from './dashboards/admin/SemesterManager';
import { DepartmentManager } from './dashboards/admin/DepartmentManager';
import { BuildingManager } from './dashboards/admin/BuildingManager';
import { FloorManager } from './dashboards/admin/FloorManager';
import { ClassroomManager } from './dashboards/admin/ClassroomManager';
import { LaboratoryManager } from './dashboards/admin/LaboratoryManager';
import { FacultyManager } from './dashboards/admin/FacultyManager';
import { AdminScheduleRequestsPage } from './dashboards/admin/AdminScheduleRequestsPage';
import { StudentManager } from './dashboards/admin/StudentManager';
import { AdminReportsPage } from './dashboards/admin/AdminReportsPage';
import { AdminSettingsPage } from './dashboards/admin/AdminSettingsPage';

const AppRoutes: React.FC = () => {
  useMobileApp();

  return (
    <Routes>
      {/* PUBLIC ROUTES (MAIN LAYOUT) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/timetable" element={<PublicTimetablePage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/campus" element={<CampusExplorerPage />} />

        {/* DEDICATED BUILDING ROUTES */}
        <Route path="/campus/vignan-bhavan" element={<BuildingDetailPage />} />
        <Route path="/campus/aryabhata-bhavan" element={<BuildingDetailPage />} />
        <Route path="/campus/nagarjuna-block" element={<BuildingDetailPage />} />
        <Route path="/campus/h-block" element={<BuildingDetailPage />} />
        <Route path="/campus/library" element={<BuildingDetailPage />} />
        <Route path="/campus/:slug" element={<BuildingDetailPage />} />

        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* AUTHENTICATION ROUTES */}
      <Route path="/login" element={<RoleSelectLoginPage />} />
      <Route path="/login/admin" element={<RoleLoginPage role="admin" />} />
      <Route path="/login/faculty" element={<RoleLoginPage role="faculty" />} />
      <Route path="/login/student" element={<RoleLoginPage role="student" />} />
      <Route path="/signup/student" element={<StudentSignupPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* STUDENT DASHBOARD ROUTES */}
      <Route path="/student" element={<DashboardLayout requiredRole="student" />}>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="timetable" element={<StudentTimetablePage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
      </Route>

      {/* FACULTY DASHBOARD ROUTES */}
      <Route path="/faculty" element={<DashboardLayout requiredRole="faculty" />}>
        <Route index element={<Navigate to="/faculty/dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="timetable" element={<FacultyDashboard />} />
        <Route path="availability" element={<FacultyAvailabilityPage />} />
        <Route path="changes" element={<FacultyChangesPage />} />
        <Route path="swap" element={<FacultySwapPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
      </Route>

      {/* ADMINISTRATOR DASHBOARD ROUTES */}
      <Route path="/admin" element={<DashboardLayout requiredRole="admin" />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="academic-years" element={<AcademicYearManager />} />
        <Route path="semesters" element={<SemesterManager />} />
        <Route path="departments" element={<DepartmentManager />} />
        <Route path="timetable" element={<TimetableManager />} />
        <Route path="faculty" element={<FacultyManager />} />
        <Route path="swap-requests" element={<AdminScheduleRequestsPage />} />
        <Route path="students" element={<StudentManager />} />
        <Route path="buildings" element={<BuildingManager />} />
        <Route path="floors" element={<FloorManager />} />
        <Route path="classrooms" element={<ClassroomManager />} />
        <Route path="laboratories" element={<LaboratoryManager />} />
        <Route path="availability" element={<AvailabilityPage />} />
        <Route path="changes" element={<FacultyChangesPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};
