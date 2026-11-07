export type Role = 'admin' | 'faculty' | 'student' | 'public';

export type RoomType = 'classroom' | 'laboratory' | 'seminar_hall' | 'facility' | 'office' | 'washroom';

export type AvailabilityStatus = 'available' | 'occupied' | 'upcoming' | 'unavailable';

export interface Building {
  id: string;
  name: string;
  originalCode: string; // e.g. "A Block", "U Block", "N Block", "H Block", "Central Library"
  slug: string;
  imageUrl: string;
  description: string;
  totalFloors: number;
  departments: string[];
  floorIds: string[];
  established?: string;
  features?: string[];
}

export interface Facility {
  id: string;
  name: string;
  type: 'entrance' | 'reception' | 'lift' | 'staircase' | 'corridor' | 'washroom' | 'common_area' | 'office' | 'facility';
  gridArea?: string; // CSS grid or SVG coordinate
}

export interface BlueprintElement {
  id: string;
  roomId?: string;
  name: string;
  type: RoomType | 'corridor' | 'lift' | 'staircase' | 'entrance' | 'courtyard' | 'restroom' | 'reception' | 'common_area' | 'facility';
  x: number; // percentage coordinate 0-100
  y: number; // percentage coordinate 0-100
  width: number; // percentage width
  height: number; // percentage height
  label: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: number; // 0 = Ground, 1 = 1st, etc.
  name: string; // "Ground Floor", "1st Floor", etc.
  blueprintDemo: boolean;
  facilities: Facility[];
  roomIds: string[];
  blueprintElements: BlueprintElement[];
}

export interface Room {
  id: string;
  roomNumber: string; // e.g. "A-101", "U-204", "N-305"
  name: string;
  buildingId: string;
  floorId: string;
  type: RoomType;
  departmentId: string;
  capacity: number;
  features: string[]; // e.g. ["Projector", "AC", "Smart Board", "Ethernet"]
  equipment?: string[]; // for laboratories
  isSchedulable: boolean;
  blueprintPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Department {
  id: string;
  code: string; // "CSE", "ECE", "AI_ML", etc.
  name: string;
  buildingId: string;
  headOfDepartment: string;
  totalFaculty: number;
  totalStudents: number;
}

export interface AcademicYear {
  id: string;
  yearName: string; // e.g. "2026-2027"
  startDate: string;
  endDate: string;
  isActive: boolean;
  isArchived: boolean;
}

export interface Semester {
  id: string;
  academicYearId: string;
  semesterNumber: number; // 1, 2, 3, 4, 5, 6, 7, 8
  name: string; // e.g. "Semester II (Even)"
  type: 'ODD' | 'EVEN';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Subject {
  id: string;
  code: string; // e.g. "21CS301"
  name: string; // e.g. "Machine Learning Techniques"
  departmentId: string;
  credits: number;
  type: 'Theory' | 'Lab' | 'Project';
}

export interface Section {
  id: string;
  name: string; // e.g. "CSE-A", "AI-ML-B"
  departmentId: string;
  yearOfStudy: number; // 1, 2, 3, 4
  semesterId: string;
  totalStudents: number;
}

export interface Faculty {
  id: string;
  facultyId: string; // e.g. "VFSTR-FAC-104"
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string; // e.g. "Professor & Head", "Associate Professor"
  cabinRoomId?: string;
  assignedSubjectIds: string[];
  avatarUrl?: string;
}

export interface Student {
  id: string;
  registrationNumber: string; // e.g. "211FA04001"
  name: string;
  email: string;
  departmentId: string;
  yearOfStudy: number;
  semesterId: string;
  sectionId: string;
  avatarUrl?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableEntry {
  id: string;
  academicYearId: string;
  semesterId: string;
  departmentId: string;
  yearOfStudy: number;
  sectionId: string;
  subjectId: string;
  /** Raw subject label returned by the backend Entry rows. */
  subject?: string;
  facultyId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  day: DayOfWeek;
  startTime: string; // "HH:MM" e.g. "08:30"
  endTime: string; // "HH:MM" e.g. "09:30"
  isLab: boolean;
  status: 'published' | 'draft' | 'cancelled';
  /** True when the row is synthetic placeholder data, not parsed from a department sheet. */
  is_mock?: boolean;
  version?: number;
}

export interface TimetableChange {
  id: string;
  timetableEntryId: string;
  changeType: 'Room Changed' | 'Faculty Reassigned' | 'Timing Shifted' | 'Class Cancelled' | 'Subject Changed' | 'Extra Class Added';
  previousValue: string;
  updatedValue: string;
  reason: string;
  updatedBy: string;
  updatedAt: string;
  effectiveDate: string;
  affectedSectionId: string;
  affectedFacultyId: string;
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'timetable_published' | 'class_change' | 'cancellation' | 'room_change' | 'general';
  targetRole: Role | 'all';
  targetUserId?: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

export interface ConflictValidationResult {
  hasConflict: boolean;
  errors: {
    type: 'faculty_double_booked' | 'room_double_booked' | 'section_double_booked' | 'invalid_interval';
    message: string;
    conflictingEntry?: TimetableEntry;
  }[];
}

export interface ResourceAvailabilityItem {
  id: string;
  name: string;
  code: string;
  type: 'classroom' | 'laboratory' | 'faculty';
  buildingName?: string;
  floorName?: string;
  departmentName: string;
  status: AvailabilityStatus;
  currentActivity?: {
    subjectName: string;
    facultyName?: string;
    sectionName?: string;
    startTime: string;
    endTime: string;
    remainingMinutes?: number;
  };
  nextActivity?: {
    subjectName: string;
    facultyName?: string;
    sectionName?: string;
    startTime: string;
    endTime: string;
    inMinutes?: number;
  };
  nextAvailableTime: string;
  capacity?: number;
}

export interface UserSession {
  id: string;
  role: Role;
  name: string;
  email: string;
  identifier: string; // Registration number or Faculty ID
  departmentId?: string;
  sectionId?: string;
  group?: string | null;
  facultyId?: string | null;
  avatarUrl?: string;
  token?: string;
  /** Admin-provisioned accounts must rotate the temporary password first. */
  mustChangePassword?: boolean;
}

export type ScheduleRequestType = 'swap' | 'replace';
export type ScheduleRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface ScheduleRequest {
  id: string;
  type: ScheduleRequestType;
  status: ScheduleRequestStatus;
  requesterId: string;
  targetFacultyId?: string | null;
  sourceEntryId: string;
  targetEntryId?: string | null;
  substituteFacultyId?: string | null;
  reason?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  decidedBy?: string | null;
  requester?: { id: string; code: string; name: string };
  targetFaculty?: { id: string; code: string; name: string } | null;
  sourceEntry?: TimetableEntry;
  targetEntry?: TimetableEntry | null;
}

export interface FacultySummary {
  id: string;
  code: string;
  name: string;
  departmentId?: string | null;
}
