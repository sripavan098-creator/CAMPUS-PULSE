import {
  Building,
  Floor,
  Room,
  Department,
  AcademicYear,
  Semester,
  Subject,
  Section,
  Faculty,
  Student,
  TimetableEntry,
  TimetableChange,
  UserNotification
} from '../types';

export const INITIAL_BUILDINGS: Building[] = [
  {
    id: 'bldg-1',
    name: 'Vignan Bhavan',
    originalCode: 'A Block',
    slug: 'vignan-bhavan',
    imageUrl: '/assets/campus-images/vignan-bhavan.webp',
    description: 'Premier academic landmark hosting administrative faculties, computer science lecture halls, high-tech multimedia seminar facilities, and foundational engineering laboratories.',
    totalFloors: 4,
    departments: ['CSE', 'IT', 'AI & ML'],
    floorIds: ['flr-a-0', 'flr-a-1', 'flr-a-2', 'flr-a-3'],
    established: '1997',
    features: ['High-speed Wi-Fi', 'Smart Podium Classrooms', 'Elevators', 'Cafeteria Wing', 'Central Reception']
  },
  {
    id: 'bldg-2',
    name: 'Aryabhata Bhavan',
    originalCode: 'U Block',
    slug: 'aryabhata-bhavan',
    imageUrl: '/assets/campus-images/aryabhata-bhavan.webp',
    description: 'Sprawling engineering and research complex housing Mechanical, Civil, and Advanced Robotics Labs alongside spacious amphitheatre-style lecture rooms.',
    totalFloors: 4,
    departments: ['MECH', 'CIVIL'],
    floorIds: ['flr-u-0', 'flr-u-1', 'flr-u-2', 'flr-u-3'],
    established: '2005',
    features: ['Heavy Machinery Labs', 'CAD/CAM Simulation Center', 'Double-height Workshop', 'Solar Rooftop']
  },
  {
    id: 'bldg-3',
    name: 'Nagarjuna Block',
    originalCode: 'N Block',
    slug: 'nagarjuna-block',
    imageUrl: '/assets/campus-images/nagarjuna-block.webp',
    description: 'Distinctive architectural block featuring iconic brown vertical exterior pillars, white and grey wings, and a serene central courtyard flanked by advanced CSE and IT labs.',
    totalFloors: 5,
    departments: ['CSE', 'AI & ML'],
    floorIds: ['flr-n-0', 'flr-n-1', 'flr-n-2', 'flr-n-3', 'flr-n-4'],
    established: '2012',
    features: ['Brown Exterior Pillars', 'Open Courtyard (LARA Oxy Zone)', 'Cloud Computing Lab', 'Faculty Cabins Wing']
  },
  {
    id: 'bldg-4',
    name: 'H Block',
    originalCode: 'H Block',
    slug: 'h-block',
    imageUrl: '/assets/campus-images/h-block.webp',
    description: 'Hub for Electrical & Electronics Engineering, Embedded Systems, Chemical Technology, and state-of-the-art VLSI research suites.',
    totalFloors: 4,
    departments: ['ECE', 'EEE', 'CHEM'],
    floorIds: ['flr-h-0', 'flr-h-1', 'flr-h-2', 'flr-h-3'],
    established: '2008',
    features: ['IoT Innovation Lab', 'Signal Processing Studio', 'High Voltage Lab', 'Faculty Research Suites']
  },
  {
    id: 'bldg-5',
    name: 'Central Library',
    originalCode: 'NTR Library',
    slug: 'library',
    imageUrl: '/assets/campus-images/central-library.webp',
    description: 'World-class multi-floor knowledge repository featuring digital knowledge zones, research carrels, extensive technical journal collections, and group study conference rooms.',
    totalFloors: 3,
    departments: ['Central Resource'],
    floorIds: ['flr-lib-0', 'flr-lib-1', 'flr-lib-2'],
    established: '2002',
    features: ['Digital Library with 200 Terminals', '24/7 Reading Hall', 'E-Journals Consortium', 'Reprography Wing']
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-cse',
    code: 'CSE',
    name: 'Computer Science and Engineering',
    buildingId: 'bldg-1',
    headOfDepartment: 'Dr. K. Radhakrishna',
    totalFaculty: 42,
    totalStudents: 920
  },
  {
    id: 'dept-aiml',
    code: 'AI & ML',
    name: 'Artificial Intelligence & Machine Learning',
    buildingId: 'bldg-3',
    headOfDepartment: 'Dr. S. Priya',
    totalFaculty: 26,
    totalStudents: 480
  },
  {
    id: 'dept-ece',
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
    buildingId: 'bldg-4',
    headOfDepartment: 'Dr. G. Venkata Raman',
    totalFaculty: 34,
    totalStudents: 720
  },
  {
    id: 'dept-eee',
    code: 'EEE',
    name: 'Electrical and Electronics Engineering',
    buildingId: 'bldg-4',
    headOfDepartment: 'Dr. B. Suresh Kumar',
    totalFaculty: 22,
    totalStudents: 360
  },
  {
    id: 'dept-mech',
    code: 'MECH',
    name: 'Mechanical Engineering',
    buildingId: 'bldg-2',
    headOfDepartment: 'Prof. P. Ramana Murthy',
    totalFaculty: 28,
    totalStudents: 420
  },
  {
    id: 'dept-civil',
    code: 'CIVIL',
    name: 'Civil Engineering',
    buildingId: 'bldg-2',
    headOfDepartment: 'Dr. T. Sudhakar',
    totalFaculty: 20,
    totalStudents: 300
  },
  {
    id: 'dept-it',
    code: 'IT',
    name: 'Information Technology',
    buildingId: 'bldg-3',
    headOfDepartment: 'Dr. M. Lakshmi',
    totalFaculty: 18,
    totalStudents: 350
  }
];

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay-2026-2027',
    yearName: '2026-2027',
    startDate: '2026-06-15',
    endDate: '2027-05-30',
    isActive: true,
    isArchived: false
  },
  {
    id: 'ay-2025-2026',
    yearName: '2025-2026',
    startDate: '2025-06-16',
    endDate: '2026-05-25',
    isActive: false,
    isArchived: true
  }
];

export const INITIAL_SEMESTERS: Semester[] = [
  {
    id: 'sem-2026-even',
    academicYearId: 'ay-2026-2027',
    semesterNumber: 2,
    name: 'Semester II / IV / VI / VIII (Even Semester)',
    type: 'EVEN',
    startDate: '2026-12-01',
    endDate: '2027-05-15',
    isActive: false
  },
  {
    id: 'sem-2026-odd',
    academicYearId: 'ay-2026-2027',
    semesterNumber: 1,
    name: 'Semester I / III / V / VII (Odd Semester)',
    type: 'ODD',
    startDate: '2026-06-15',
    endDate: '2026-11-20',
    isActive: true
  }
];

export const INITIAL_SECTIONS: Section[] = [
  {
    id: 'sec-cse-3a',
    name: 'CSE-3A',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    semesterId: 'sem-2026-even',
    totalStudents: 68
  },
  {
    id: 'sec-cse-3b',
    name: 'CSE-3B',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    semesterId: 'sem-2026-even',
    totalStudents: 66
  },
  {
    id: 'sec-aiml-2a',
    name: 'AIML-2A',
    departmentId: 'dept-aiml',
    yearOfStudy: 2,
    semesterId: 'sem-2026-even',
    totalStudents: 60
  },
  {
    id: 'sec-ece-3a',
    name: 'ECE-3A',
    departmentId: 'dept-ece',
    yearOfStudy: 3,
    semesterId: 'sem-2026-even',
    totalStudents: 64
  },
  {
    id: 'sec-mech-4a',
    name: 'MECH-4A',
    departmentId: 'dept-mech',
    yearOfStudy: 4,
    semesterId: 'sem-2026-even',
    totalStudents: 55
  }
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-ml',
    code: '21CS301',
    name: 'Machine Learning Techniques',
    departmentId: 'dept-cse',
    credits: 4,
    type: 'Theory'
  },
  {
    id: 'sub-ml-lab',
    code: '21CS351',
    name: 'Machine Learning Lab',
    departmentId: 'dept-cse',
    credits: 2,
    type: 'Lab'
  },
  {
    id: 'sub-cn',
    code: '21CS302',
    name: 'Computer Networks',
    departmentId: 'dept-cse',
    credits: 4,
    type: 'Theory'
  },
  {
    id: 'sub-cloud',
    code: '21CS303',
    name: 'Cloud Computing & DevOps',
    departmentId: 'dept-cse',
    credits: 3,
    type: 'Theory'
  },
  {
    id: 'sub-web',
    code: '21CS304',
    name: 'Full Stack Web Architecture',
    departmentId: 'dept-cse',
    credits: 4,
    type: 'Theory'
  },
  {
    id: 'sub-ai-nlp',
    code: '21AI201',
    name: 'Natural Language Processing',
    departmentId: 'dept-aiml',
    credits: 4,
    type: 'Theory'
  },
  {
    id: 'sub-ai-lab',
    code: '21AI251',
    name: 'Deep Learning & NLP Lab',
    departmentId: 'dept-aiml',
    credits: 2,
    type: 'Lab'
  },
  {
    id: 'sub-vlsi',
    code: '21EC301',
    name: 'VLSI Design & Embedded Systems',
    departmentId: 'dept-ece',
    credits: 4,
    type: 'Theory'
  },
  {
    id: 'sub-cad',
    code: '21ME401',
    name: 'CAD/CAM Finite Element Analysis',
    departmentId: 'dept-mech',
    credits: 4,
    type: 'Theory'
  }
];

export const INITIAL_FACULTY: Faculty[] = [
  {
    id: 'fac-1',
    facultyId: 'VFSTR-FAC-101',
    name: 'Dr. K. Radhakrishna',
    email: 'k_radhakrishna@vignan.ac.in',
    phone: '+91 94401 23456',
    departmentId: 'dept-cse',
    designation: 'Professor & Head',
    cabinRoomId: 'room-a-205',
    assignedSubjectIds: ['sub-ml', 'sub-ml-lab']
  },
  {
    id: 'fac-2',
    facultyId: 'VFSTR-FAC-102',
    name: 'Dr. S. Priya',
    email: 's_priya@vignan.ac.in',
    phone: '+91 98480 34567',
    departmentId: 'dept-aiml',
    designation: 'Associate Professor',
    cabinRoomId: 'room-n-208',
    assignedSubjectIds: ['sub-ai-nlp', 'sub-ai-lab']
  },
  {
    id: 'fac-3',
    facultyId: 'VFSTR-FAC-103',
    name: 'Prof. M. Venkat Rao',
    email: 'm_venkatrao@vignan.ac.in',
    phone: '+91 94901 88776',
    departmentId: 'dept-cse',
    designation: 'Associate Professor',
    cabinRoomId: 'room-a-206',
    assignedSubjectIds: ['sub-cn', 'sub-cloud']
  },
  {
    id: 'fac-4',
    facultyId: 'VFSTR-FAC-104',
    name: 'Dr. Ananya Sen',
    email: 'a_sen@vignan.ac.in',
    phone: '+91 91234 56789',
    departmentId: 'dept-cse',
    designation: 'Assistant Professor',
    cabinRoomId: 'room-a-207',
    assignedSubjectIds: ['sub-web']
  },
  {
    id: 'fac-5',
    facultyId: 'VFSTR-FAC-105',
    name: 'Dr. G. Venkata Raman',
    email: 'g_vraman@vignan.ac.in',
    phone: '+91 97001 54321',
    departmentId: 'dept-ece',
    designation: 'Professor & Head',
    cabinRoomId: 'room-h-201',
    assignedSubjectIds: ['sub-vlsi']
  },
  {
    id: 'fac-6',
    facultyId: 'VFSTR-FAC-106',
    name: 'Prof. P. Ramana Murthy',
    email: 'p_rmurthy@vignan.ac.in',
    phone: '+91 98888 12345',
    departmentId: 'dept-mech',
    designation: 'Professor & Dean',
    cabinRoomId: 'room-u-205',
    assignedSubjectIds: ['sub-cad']
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stud-1',
    registrationNumber: '211FA04001',
    name: 'Rahul Sharma',
    email: 'rahul.211fa04001@vignan.ac.in',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    semesterId: 'sem-2026-even',
    sectionId: 'sec-cse-3a'
  },
  {
    id: 'stud-2',
    registrationNumber: '221FA05022',
    name: 'Sneha Reddy',
    email: 'sneha.221fa05022@vignan.ac.in',
    departmentId: 'dept-aiml',
    yearOfStudy: 2,
    semesterId: 'sem-2026-even',
    sectionId: 'sec-aiml-2a'
  }
];

// FLOORS SETUP
// Ground floor requirement: No classrooms automatically on Ground floor! Only facilities or specific rooms.
export const INITIAL_FLOORS: Floor[] = [
  // VIGNAN BHAVAN (A Block)
  {
    id: 'flr-a-0',
    buildingId: 'bldg-1',
    floorNumber: 0,
    name: 'Ground Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-a-01', name: 'Main Portico & Grand Entrance', type: 'entrance' },
      { id: 'fac-a-02', name: 'Central University Reception & Helpdesk', type: 'reception' },
      { id: 'fac-a-03', name: 'Security & Surveillance Desk', type: 'office' },
      { id: 'fac-a-04', name: 'Main Elevator Lobby (2 Lifts)', type: 'lift' },
      { id: 'fac-a-05', name: 'East & West Stairwells', type: 'staircase' },
      { id: 'fac-a-06', name: 'Administrative Director Office', type: 'office' }
    ],
    roomIds: [], // No registered classrooms on this floor as per prompt requirement!
    blueprintElements: [
      { id: 'be-a0-1', name: 'Main Grand Entrance & Portico', type: 'entrance', x: 35, y: 75, width: 30, height: 20, label: 'Grand Entrance' },
      { id: 'be-a0-2', name: 'Central Reception & Visitor Lounge', type: 'reception', x: 20, y: 40, width: 25, height: 25, label: 'Central Reception' },
      { id: 'be-a0-3', name: 'Security & Campus Pulse Hub', type: 'office', x: 55, y: 40, width: 25, height: 25, label: 'Security & Info Hub' },
      { id: 'be-a0-4', name: 'North Central Corridor', type: 'corridor', x: 10, y: 30, width: 80, height: 8, label: 'Main Corridor' },
      { id: 'be-a0-5', name: 'Elevator Lobby (North)', type: 'lift', x: 45, y: 10, width: 10, height: 15, label: 'Lifts' },
      { id: 'be-a0-6', name: 'East Stairwell', type: 'staircase', x: 80, y: 10, width: 12, height: 15, label: 'Stairs East' },
      { id: 'be-a0-7', name: 'West Stairwell', type: 'staircase', x: 8, y: 10, width: 12, height: 15, label: 'Stairs West' }
    ]
  },
  {
    id: 'flr-a-1',
    buildingId: 'bldg-1',
    floorNumber: 1,
    name: 'First Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-a-11', name: 'Central Connecting Corridor', type: 'corridor' },
      { id: 'fac-a-12', name: 'Dual Elevator Bank', type: 'lift' },
      { id: 'fac-a-13', name: 'East Staircase', type: 'staircase' },
      { id: 'fac-a-14', name: 'Restrooms (Men & Women)', type: 'washroom' }
    ],
    roomIds: ['room-a-101', 'room-a-102', 'room-a-103', 'room-a-104', 'room-a-lab1'],
    blueprintElements: [
      { id: 'be-a1-1', roomId: 'room-a-101', name: 'Room A-101 (Smart Lecture)', type: 'classroom', x: 5, y: 10, width: 20, height: 35, label: 'A-101' },
      { id: 'be-a1-2', roomId: 'room-a-102', name: 'Room A-102 (Smart Lecture)', type: 'classroom', x: 27, y: 10, width: 20, height: 35, label: 'A-102' },
      { id: 'be-a1-3', roomId: 'room-a-103', name: 'Room A-103 (Interactive)', type: 'classroom', x: 53, y: 10, width: 20, height: 35, label: 'A-103' },
      { id: 'be-a1-4', roomId: 'room-a-104', name: 'Room A-104 (Auditorium Class)', type: 'classroom', x: 75, y: 10, width: 20, height: 35, label: 'A-104' },
      { id: 'be-a1-5', name: 'Main Academic Spine Corridor', type: 'corridor', x: 5, y: 48, width: 90, height: 10, label: 'Spine Corridor' },
      { id: 'be-a1-6', roomId: 'room-a-lab1', name: 'A-Lab 1 (Advanced Software Engineering)', type: 'laboratory', x: 15, y: 62, width: 40, height: 32, label: 'A-Lab 1 (Software Lab)' },
      { id: 'be-a1-7', name: 'Elevator Lobby', type: 'lift', x: 60, y: 62, width: 12, height: 16, label: 'Lift' },
      { id: 'be-a1-8', name: 'East Staircase', type: 'staircase', x: 75, y: 62, width: 15, height: 32, label: 'Stairs' }
    ]
  },
  {
    id: 'flr-a-2',
    buildingId: 'bldg-1',
    floorNumber: 2,
    name: 'Second Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-a-21', name: 'Department Administration Wing', type: 'office' },
      { id: 'fac-a-22', name: 'Central Lift', type: 'lift' }
    ],
    roomIds: ['room-a-201', 'room-a-202', 'room-a-203', 'room-a-204'],
    blueprintElements: [
      { id: 'be-a2-1', roomId: 'room-a-201', name: 'Room A-201', type: 'classroom', x: 5, y: 10, width: 22, height: 35, label: 'A-201' },
      { id: 'be-a2-2', roomId: 'room-a-202', name: 'Room A-202', type: 'classroom', x: 29, y: 10, width: 22, height: 35, label: 'A-202' },
      { id: 'be-a2-3', roomId: 'room-a-203', name: 'Room A-203', type: 'classroom', x: 53, y: 10, width: 22, height: 35, label: 'A-203' },
      { id: 'be-a2-4', roomId: 'room-a-204', name: 'Room A-204 (Seminar Room)', type: 'classroom', x: 77, y: 10, width: 18, height: 35, label: 'A-204' },
      { id: 'be-a2-5', name: 'Corridor', type: 'corridor', x: 5, y: 48, width: 90, height: 10, label: 'Central Corridor' },
      { id: 'be-a2-6', name: 'Faculty Cabins Suite', type: 'office', x: 10, y: 62, width: 50, height: 30, label: 'Faculty Research Chambers' },
      { id: 'be-a2-7', name: 'Stairs & Lift', type: 'staircase', x: 65, y: 62, width: 25, height: 30, label: 'Vertical Access' }
    ]
  },
  {
    id: 'flr-a-3',
    buildingId: 'bldg-1',
    floorNumber: 3,
    name: 'Third Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-a-31', name: 'High-Performance Research Suite', type: 'office' }
    ],
    roomIds: ['room-a-301', 'room-a-302', 'room-a-lab3'],
    blueprintElements: [
      { id: 'be-a3-1', roomId: 'room-a-301', name: 'Room A-301', type: 'classroom', x: 5, y: 10, width: 25, height: 35, label: 'A-301' },
      { id: 'be-a3-2', roomId: 'room-a-302', name: 'Room A-302', type: 'classroom', x: 33, y: 10, width: 25, height: 35, label: 'A-302' },
      { id: 'be-a3-3', roomId: 'room-a-lab3', name: 'A-Lab 3 (Cloud Data Center)', type: 'laboratory', x: 61, y: 10, width: 34, height: 80, label: 'A-Lab 3 (Cloud)' },
      { id: 'be-a3-4', name: 'Corridor', type: 'corridor', x: 5, y: 48, width: 53, height: 10, label: 'Corridor' },
      { id: 'be-a3-5', name: 'Conference Hall', type: 'common_area', x: 5, y: 62, width: 53, height: 28, label: 'Dean Conference Room' }
    ]
  },

  // NAGARJUNA BLOCK (N Block) - Iconic Brown Pillars & Central Courtyard
  {
    id: 'flr-n-0',
    buildingId: 'bldg-3',
    floorNumber: 0,
    name: 'Ground Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-n-01', name: 'Grand Pillar Portico (Brown Vertical Colonnade)', type: 'entrance' },
      { id: 'fac-n-02', name: 'Open Air Lush Courtyard (LARA Oxy Zone)', type: 'common_area' },
      { id: 'fac-n-03', name: 'N Block Reception & Security Hub', type: 'reception' },
      { id: 'fac-n-04', name: 'Quad Lifts Lobby', type: 'lift' },
      { id: 'fac-n-05', name: 'Corner Stairwells', type: 'staircase' }
    ],
    roomIds: [], // Ground floor strictly no automatic classrooms!
    blueprintElements: [
      { id: 'be-n0-1', name: 'Iconic Brown Pillar Colonnade', type: 'entrance', x: 5, y: 80, width: 90, height: 15, label: 'Brown Vertical Pillars Colonnade' },
      { id: 'be-n0-2', name: 'Lush Central Courtyard (Oxy Zone)', type: 'courtyard', x: 30, y: 25, width: 40, height: 45, label: 'Central Open Courtyard' },
      { id: 'be-n0-3', name: 'West Colonnade Gallery', type: 'corridor', x: 10, y: 20, width: 15, height: 55, label: 'West Walkway' },
      { id: 'be-n0-4', name: 'East Colonnade Gallery', type: 'corridor', x: 75, y: 20, width: 15, height: 55, label: 'East Walkway' },
      { id: 'be-n0-5', name: 'North Administration Wing', type: 'reception', x: 25, y: 5, width: 50, height: 15, label: 'N Block Reception & Office' }
    ]
  },
  {
    id: 'flr-n-1',
    buildingId: 'bldg-3',
    floorNumber: 1,
    name: 'First Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-n-11', name: 'Courtyard Viewing Balcony', type: 'common_area' },
      { id: 'fac-n-12', name: 'West Lift', type: 'lift' },
      { id: 'fac-n-13', name: 'East Lift', type: 'lift' }
    ],
    roomIds: ['room-n-101', 'room-n-102', 'room-n-103', 'room-n-lab1'],
    blueprintElements: [
      { id: 'be-n1-1', roomId: 'room-n-101', name: 'Room N-101', type: 'classroom', x: 5, y: 10, width: 22, height: 30, label: 'N-101' },
      { id: 'be-n1-2', roomId: 'room-n-102', name: 'Room N-102', type: 'classroom', x: 5, y: 45, width: 22, height: 30, label: 'N-102' },
      { id: 'be-n1-3', name: 'Open Air Courtyard Atrium', type: 'courtyard', x: 32, y: 25, width: 36, height: 45, label: 'Central Courtyard Atrium' },
      { id: 'be-n1-4', roomId: 'room-n-103', name: 'Room N-103', type: 'classroom', x: 73, y: 10, width: 22, height: 30, label: 'N-103' },
      { id: 'be-n1-5', roomId: 'room-n-lab1', name: 'N-Lab 1 (AI & Machine Learning Lab)', type: 'laboratory', x: 73, y: 45, width: 22, height: 45, label: 'N-Lab 1 (AI)' },
      { id: 'be-n1-6', name: 'North Walkway', type: 'corridor', x: 5, y: 2, width: 90, height: 6, label: 'North Gallery' },
      { id: 'be-n1-7', name: 'South Walkway', type: 'corridor', x: 5, y: 92, width: 90, height: 6, label: 'South Gallery' }
    ]
  },
  {
    id: 'flr-n-2',
    buildingId: 'bldg-3',
    floorNumber: 2,
    name: 'Second Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-n-21', name: 'Courtyard Viewing Gallery', type: 'common_area' }
    ],
    roomIds: ['room-n-201', 'room-n-202', 'room-n-203', 'room-n-204'],
    blueprintElements: [
      { id: 'be-n2-1', roomId: 'room-n-201', name: 'Room N-201', type: 'classroom', x: 5, y: 10, width: 22, height: 35, label: 'N-201' },
      { id: 'be-n2-2', roomId: 'room-n-202', name: 'Room N-202', type: 'classroom', x: 5, y: 50, width: 22, height: 35, label: 'N-202' },
      { id: 'be-n2-3', name: 'Courtyard Void', type: 'courtyard', x: 32, y: 25, width: 36, height: 45, label: 'Courtyard Open Void' },
      { id: 'be-n2-4', roomId: 'room-n-203', name: 'Room N-203', type: 'classroom', x: 73, y: 10, width: 22, height: 35, label: 'N-203' },
      { id: 'be-n2-5', roomId: 'room-n-204', name: 'Room N-204', type: 'classroom', x: 73, y: 50, width: 22, height: 35, label: 'N-204' }
    ]
  },
  {
    id: 'flr-n-3',
    buildingId: 'bldg-3',
    floorNumber: 3,
    name: 'Third Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-n-31', name: 'Department Seminar Gallery', type: 'common_area' }
    ],
    roomIds: ['room-n-301', 'room-n-302', 'room-n-305'],
    blueprintElements: [
      { id: 'be-n3-1', roomId: 'room-n-301', name: 'Room N-301', type: 'classroom', x: 5, y: 10, width: 22, height: 35, label: 'N-301' },
      { id: 'be-n3-2', roomId: 'room-n-302', name: 'Room N-302', type: 'classroom', x: 5, y: 50, width: 22, height: 35, label: 'N-302' },
      { id: 'be-n3-3', name: 'Courtyard Void', type: 'courtyard', x: 32, y: 25, width: 36, height: 45, label: 'Courtyard' },
      { id: 'be-n3-4', roomId: 'room-n-305', name: 'Room N-305 (Research Seminar)', type: 'seminar_hall', x: 73, y: 15, width: 22, height: 70, label: 'N-305 (Seminar)' }
    ]
  },

  // ARYABHATA BHAVAN (U Block)
  {
    id: 'flr-u-0',
    buildingId: 'bldg-2',
    floorNumber: 0,
    name: 'Ground Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-u-01', name: 'Heavy Machinery Access & Entrance', type: 'entrance' },
      { id: 'fac-u-02', name: 'Mechanical Workshop Forecourt', type: 'common_area' },
      { id: 'fac-u-03', name: 'Security & Safety Office', type: 'office' }
    ],
    roomIds: [], // Ground floor strictly no classrooms!
    blueprintElements: [
      { id: 'be-u0-1', name: 'Workshop Loading & Access Portico', type: 'entrance', x: 10, y: 70, width: 80, height: 25, label: 'Heavy Machinery Entrance' },
      { id: 'be-u0-2', name: 'Central Equipment Staging Arena', type: 'common_area', x: 20, y: 15, width: 60, height: 45, label: 'Engineering Staging Arena' }
    ]
  },
  {
    id: 'flr-u-1',
    buildingId: 'bldg-2',
    floorNumber: 1,
    name: 'First Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-u-11', name: 'Spacious Crossway Corridor', type: 'corridor' }
    ],
    roomIds: ['room-u-101', 'room-u-102', 'room-u-lab1'],
    blueprintElements: [
      { id: 'be-u1-1', roomId: 'room-u-101', name: 'Room U-101', type: 'classroom', x: 5, y: 15, width: 26, height: 40, label: 'U-101' },
      { id: 'be-u1-2', roomId: 'room-u-102', name: 'Room U-102', type: 'classroom', x: 35, y: 15, width: 26, height: 40, label: 'U-102' },
      { id: 'be-u1-3', roomId: 'room-u-lab1', name: 'U-Lab 1 (Robotics & Mechatronics Lab)', type: 'laboratory', x: 65, y: 15, width: 30, height: 75, label: 'U-Lab 1 (Robotics)' },
      { id: 'be-u1-4', name: 'Corridor', type: 'corridor', x: 5, y: 60, width: 56, height: 12, label: 'Corridor' }
    ]
  },
  {
    id: 'flr-u-2',
    buildingId: 'bldg-2',
    floorNumber: 2,
    name: 'Second Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-u-21', name: 'Elevator & Stairwell', type: 'lift' }
    ],
    roomIds: ['room-u-201', 'room-u-204'],
    blueprintElements: [
      { id: 'be-u2-1', roomId: 'room-u-201', name: 'Room U-201', type: 'classroom', x: 10, y: 15, width: 35, height: 45, label: 'U-201' },
      { id: 'be-u2-2', roomId: 'room-u-204', name: 'Room U-204 (CAD Studio)', type: 'laboratory', x: 55, y: 15, width: 35, height: 45, label: 'U-204 (CAD Studio)' },
      { id: 'be-u2-3', name: 'Corridor', type: 'corridor', x: 10, y: 65, width: 80, height: 15, label: 'Main Corridor' }
    ]
  },

  // H BLOCK
  {
    id: 'flr-h-0',
    buildingId: 'bldg-4',
    floorNumber: 0,
    name: 'Ground Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-h-01', name: 'Main Lobby & High Voltage Switchgear Room', type: 'entrance' },
      { id: 'fac-h-02', name: 'Central Lift', type: 'lift' }
    ],
    roomIds: [], // Ground floor strictly no classrooms!
    blueprintElements: [
      { id: 'be-h0-1', name: 'H-Block Grand Portico', type: 'entrance', x: 25, y: 70, width: 50, height: 25, label: 'H Block Entrance' },
      { id: 'be-h0-2', name: 'Electrical Substation & Control Enclosure', type: 'facility', x: 20, y: 15, width: 60, height: 45, label: 'Campus Power & Control Unit' }
    ]
  },
  {
    id: 'flr-h-1',
    buildingId: 'bldg-4',
    floorNumber: 1,
    name: 'First Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-h-11', name: 'ECE Department Corridor', type: 'corridor' }
    ],
    roomIds: ['room-h-101', 'room-h-102', 'room-h-lab1'],
    blueprintElements: [
      { id: 'be-h1-1', roomId: 'room-h-101', name: 'Room H-101', type: 'classroom', x: 8, y: 15, width: 25, height: 40, label: 'H-101' },
      { id: 'be-h1-2', roomId: 'room-h-102', name: 'Room H-102', type: 'classroom', x: 37, y: 15, width: 25, height: 40, label: 'H-102' },
      { id: 'be-h1-3', roomId: 'room-h-lab1', name: 'H-Lab 1 (VLSI & Embedded Systems)', type: 'laboratory', x: 66, y: 15, width: 26, height: 70, label: 'H-Lab 1 (VLSI)' },
      { id: 'be-h1-4', name: 'Corridor', type: 'corridor', x: 8, y: 60, width: 54, height: 12, label: 'Corridor' }
    ]
  },

  // CENTRAL LIBRARY
  {
    id: 'flr-lib-0',
    buildingId: 'bldg-5',
    floorNumber: 0,
    name: 'Ground Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-lib-01', name: 'Turnstile Security & Smart Card Check-in', type: 'entrance' },
      { id: 'fac-lib-02', name: 'Circulation & Issue/Return Desk', type: 'reception' },
      { id: 'fac-lib-03', name: 'Baggage Deposit Counter', type: 'facility' }
    ],
    roomIds: ['room-lib-101'],
    blueprintElements: [
      { id: 'be-lib0-1', name: 'Smart RFID Entry Gates', type: 'entrance', x: 35, y: 75, width: 30, height: 20, label: 'RFID Entry Turnstiles' },
      { id: 'be-lib0-2', name: 'Central Book Circulation Desk', type: 'reception', x: 20, y: 40, width: 30, height: 25, label: 'Circulation Desk' },
      { id: 'be-lib0-3', roomId: 'room-lib-101', name: 'Newspaper & Periodic Journal Section', type: 'facility', x: 55, y: 20, width: 40, height: 45, label: 'Periodical Gallery' }
    ]
  },
  {
    id: 'flr-lib-1',
    buildingId: 'bldg-5',
    floorNumber: 1,
    name: 'First Floor',
    blueprintDemo: true,
    facilities: [
      { id: 'fac-lib-11', name: 'Silence Zone Central Reading Hall', type: 'common_area' }
    ],
    roomIds: ['room-lib-201', 'room-lib-digital'],
    blueprintElements: [
      { id: 'be-lib1-1', roomId: 'room-lib-digital', name: 'Digital Library & E-Resource Center', type: 'laboratory', x: 8, y: 15, width: 40, height: 70, label: 'Digital Library (150 PCs)' },
      { id: 'be-lib1-2', roomId: 'room-lib-201', name: 'Reference Stacks & Research Carrels', type: 'classroom', x: 52, y: 15, width: 40, height: 70, label: 'Reference Hall' }
    ]
  }
];

// ROOMS SETUP
export const INITIAL_ROOMS: Room[] = [
  // Vignan Bhavan (A Block) - Floor 1
  {
    id: 'room-a-101',
    roomNumber: 'A-101',
    name: 'Smart Lecture Theatre A-101',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    type: 'classroom',
    departmentId: 'dept-cse',
    capacity: 75,
    features: ['High-Res Projector', 'Interactive Smart Podium', 'Central AC', 'Acoustic Soundproofing', 'Wi-Fi 6'],
    isSchedulable: true,
    blueprintPosition: { x: 5, y: 10, width: 20, height: 35 }
  },
  {
    id: 'room-a-102',
    roomNumber: 'A-102',
    name: 'Multimedia Classroom A-102',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    type: 'classroom',
    departmentId: 'dept-cse',
    capacity: 70,
    features: ['Projector', 'Audio System', 'Whiteboard', 'LAN Ports'],
    isSchedulable: true,
    blueprintPosition: { x: 27, y: 10, width: 20, height: 35 }
  },
  {
    id: 'room-a-103',
    roomNumber: 'A-103',
    name: 'Interactive Hall A-103',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    type: 'classroom',
    departmentId: 'dept-cse',
    capacity: 65,
    features: ['Smart Display', 'Dual Projectors', 'AC'],
    isSchedulable: true,
    blueprintPosition: { x: 53, y: 10, width: 20, height: 35 }
  },
  {
    id: 'room-a-104',
    roomNumber: 'A-104',
    name: 'Lecture Hall A-104',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    type: 'classroom',
    departmentId: 'dept-cse',
    capacity: 80,
    features: ['Tiered Seating', 'Projector', 'Collar Mic Audio'],
    isSchedulable: true,
    blueprintPosition: { x: 75, y: 10, width: 20, height: 35 }
  },
  {
    id: 'room-a-lab1',
    roomNumber: 'A-Lab 101',
    name: 'Advanced Software Engineering Lab',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    type: 'laboratory',
    departmentId: 'dept-cse',
    capacity: 60,
    features: ['60 i7 Workstations', 'Gigabit Ethernet', 'Dual Projector', 'High Power UPS'],
    equipment: ['Intel Core i7-13700 / 32GB RAM / 1TB NVMe', 'NVIDIA RTX 4060 GPUs', 'Cisco Layer 3 Switches'],
    isSchedulable: true,
    blueprintPosition: { x: 15, y: 62, width: 40, height: 32 }
  },

  // Vignan Bhavan - Floor 2
  {
    id: 'room-a-201',
    roomNumber: 'A-201',
    name: 'Classroom A-201',
    buildingId: 'bldg-1',
    floorId: 'flr-a-2',
    type: 'classroom',
    departmentId: 'dept-it',
    capacity: 70,
    features: ['Smart Board', 'AC', 'Projector'],
    isSchedulable: true,
    blueprintPosition: { x: 5, y: 10, width: 22, height: 35 }
  },
  {
    id: 'room-a-202',
    roomNumber: 'A-202',
    name: 'Classroom A-202',
    buildingId: 'bldg-1',
    floorId: 'flr-a-2',
    type: 'classroom',
    departmentId: 'dept-it',
    capacity: 70,
    features: ['Projector', 'Audio Support'],
    isSchedulable: true,
    blueprintPosition: { x: 29, y: 10, width: 22, height: 35 }
  },
  {
    id: 'room-a-203',
    roomNumber: 'A-203',
    name: 'Classroom A-203',
    buildingId: 'bldg-1',
    floorId: 'flr-a-2',
    type: 'classroom',
    departmentId: 'dept-it',
    capacity: 65,
    features: ['Projector', 'AC'],
    isSchedulable: true,
    blueprintPosition: { x: 53, y: 10, width: 22, height: 35 }
  },
  {
    id: 'room-a-204',
    roomNumber: 'A-204',
    name: 'Seminar Hall A-204',
    buildingId: 'bldg-1',
    floorId: 'flr-a-2',
    type: 'seminar_hall',
    departmentId: 'dept-cse',
    capacity: 120,
    features: ['Surround Sound', 'Dual 4K Projectors', 'Wireless Mics', 'Tiered Seating'],
    isSchedulable: true,
    blueprintPosition: { x: 77, y: 10, width: 18, height: 35 }
  },

  // Nagarjuna Block (N Block) - Floor 1
  {
    id: 'room-n-101',
    roomNumber: 'N-101',
    name: 'Smart Classroom N-101',
    buildingId: 'bldg-3',
    floorId: 'flr-n-1',
    type: 'classroom',
    departmentId: 'dept-aiml',
    capacity: 70,
    features: ['4K Smart Interactive Panel', 'Courtyard View', 'Central AC'],
    isSchedulable: true,
    blueprintPosition: { x: 5, y: 10, width: 22, height: 30 }
  },
  {
    id: 'room-n-102',
    roomNumber: 'N-102',
    name: 'Classroom N-102',
    buildingId: 'bldg-3',
    floorId: 'flr-n-1',
    type: 'classroom',
    departmentId: 'dept-aiml',
    capacity: 70,
    features: ['Projector', 'AC', 'Wi-Fi'],
    isSchedulable: true,
    blueprintPosition: { x: 5, y: 45, width: 22, height: 30 }
  },
  {
    id: 'room-n-103',
    roomNumber: 'N-103',
    name: 'Classroom N-103',
    buildingId: 'bldg-3',
    floorId: 'flr-n-1',
    type: 'classroom',
    departmentId: 'dept-cse',
    capacity: 75,
    features: ['Smart Board', 'Audio System', 'Courtyard Facing'],
    isSchedulable: true,
    blueprintPosition: { x: 73, y: 10, width: 22, height: 30 }
  },
  {
    id: 'room-n-lab1',
    roomNumber: 'N-Lab 101',
    name: 'Deep Learning & GPU Computing Lab',
    buildingId: 'bldg-3',
    floorId: 'flr-n-1',
    type: 'laboratory',
    departmentId: 'dept-aiml',
    capacity: 55,
    features: ['50 GPU Workstations', 'Dual Display Terminals', 'Dedicated Fiber Uplink'],
    equipment: ['NVIDIA RTX A5000 Workstations', 'PyTorch & TensorFlow Pre-configured Stacks', '10G Backbone'],
    isSchedulable: true,
    blueprintPosition: { x: 73, y: 45, width: 22, height: 45 }
  },

  // Nagarjuna Block - Floor 2
  {
    id: 'room-n-201',
    roomNumber: 'N-201',
    name: 'Classroom N-201',
    buildingId: 'bldg-3',
    floorId: 'flr-n-2',
    type: 'classroom',
    departmentId: 'dept-aiml',
    capacity: 65,
    features: ['Projector', 'AC'],
    isSchedulable: true,
    blueprintPosition: { x: 5, y: 10, width: 22, height: 35 }
  },
  {
    id: 'room-n-202',
    roomNumber: 'N-202',
    name: 'Classroom N-202',
    buildingId: 'bldg-3',
    floorId: 'flr-n-2',
    type: 'classroom',
    departmentId: 'dept-aiml',
    capacity: 65,
    features: ['Projector', 'AC'],
    isSchedulable: true,
    blueprintPosition: { x: 5, y: 50, width: 22, height: 35 }
  },
  {
    id: 'room-n-203',
    roomNumber: 'N-203',
    name: 'Classroom N-203',
    buildingId: 'bldg-3',
    floorId: 'flr-n-2',
    type: 'classroom',
    departmentId: 'dept-cse',
    capacity: 70,
    features: ['Projector', 'AC'],
    isSchedulable: true,
    blueprintPosition: { x: 73, y: 10, width: 22, height: 35 }
  },
  {
    id: 'room-n-204',
    roomNumber: 'N-204',
    name: 'Classroom N-204 (Featured Block Room)',
    buildingId: 'bldg-3',
    floorId: 'flr-n-2',
    type: 'classroom',
    departmentId: 'dept-cse',
    capacity: 75,
    features: ['4K Laser Projector', 'Courtyard Balcony Access', 'Central AC', 'Smart Podium'],
    isSchedulable: true,
    blueprintPosition: { x: 73, y: 50, width: 22, height: 35 }
  },

  // Nagarjuna Block - Floor 3
  {
    id: 'room-n-305',
    roomNumber: 'N-305',
    name: 'Nagarjuna Executive Seminar Suite',
    buildingId: 'bldg-3',
    floorId: 'flr-n-3',
    type: 'seminar_hall',
    departmentId: 'dept-aiml',
    capacity: 100,
    features: ['Executive Leather Seating', 'Dual Smart Laser Panels', 'Video Conferencing Studio'],
    isSchedulable: true,
    blueprintPosition: { x: 73, y: 15, width: 22, height: 70 }
  },

  // Aryabhata Bhavan (U Block)
  {
    id: 'room-u-101',
    roomNumber: 'U-101',
    name: 'Mechanical Lecture Hall U-101',
    buildingId: 'bldg-2',
    floorId: 'flr-u-1',
    type: 'classroom',
    departmentId: 'dept-mech',
    capacity: 80,
    features: ['High-Power Projector', 'Drawing Board Facility', 'AC'],
    isSchedulable: true,
    blueprintPosition: { x: 5, y: 15, width: 26, height: 40 }
  },
  {
    id: 'room-u-204',
    roomNumber: 'U-204',
    name: 'CAD/CAM Simulation & Modeling Studio',
    buildingId: 'bldg-2',
    floorId: 'flr-u-2',
    type: 'laboratory',
    departmentId: 'dept-mech',
    capacity: 50,
    features: ['50 High-End CAD Stations', 'ANSYS & SolidWorks Licences', '3D Rapid Prototyping Unit'],
    equipment: ['Workstations with NVIDIA Quadro GPUs', 'Ultimaker 3D Printers', 'Plotters'],
    isSchedulable: true,
    blueprintPosition: { x: 55, y: 15, width: 35, height: 45 }
  },

  // H Block
  {
    id: 'room-h-101',
    roomNumber: 'H-101',
    name: 'ECE Lecture Room H-101',
    buildingId: 'bldg-4',
    floorId: 'flr-h-1',
    type: 'classroom',
    departmentId: 'dept-ece',
    capacity: 70,
    features: ['Smart Projector', 'AC', 'Digital Oscilloscope Interface'],
    isSchedulable: true,
    blueprintPosition: { x: 8, y: 15, width: 25, height: 40 }
  },
  {
    id: 'room-h-lab1',
    roomNumber: 'H-Lab 101',
    name: 'VLSI & Advanced Embedded Systems Lab',
    buildingId: 'bldg-4',
    floorId: 'flr-h-1',
    type: 'laboratory',
    departmentId: 'dept-ece',
    capacity: 45,
    features: ['FPGA Evaluation Kits', 'Cadence EDA Suite', 'Digital Logic Analyzers'],
    equipment: ['Xilinx Zynq-7000 SoC Boards', 'Tektronix 100MHz Digital Storage Oscilloscopes'],
    isSchedulable: true,
    blueprintPosition: { x: 66, y: 15, width: 26, height: 70 }
  },

  // Central Library
  {
    id: 'room-lib-101',
    roomNumber: 'LIB-101',
    name: 'Periodical & Journal Reading Wing',
    buildingId: 'bldg-5',
    floorId: 'flr-lib-0',
    type: 'facility',
    departmentId: 'dept-cse',
    capacity: 100,
    features: ['Reading desks', 'National & International Journals', 'Wi-Fi'],
    isSchedulable: false,
    blueprintPosition: { x: 55, y: 20, width: 40, height: 45 }
  },
  {
    id: 'room-lib-digital',
    roomNumber: 'LIB-201',
    name: 'NTR Digital Research & E-Learning Center',
    buildingId: 'bldg-5',
    floorId: 'flr-lib-1',
    type: 'laboratory',
    departmentId: 'dept-cse',
    capacity: 150,
    features: ['150 All-in-One PC Terminals', 'IEEE Xplore & Springer Access', 'Silent Zone'],
    equipment: ['HP EliteDesk All-in-One Systems', 'High-Speed Internet Gateway'],
    isSchedulable: true,
    blueprintPosition: { x: 8, y: 15, width: 40, height: 70 }
  }
];

// TIMETABLE ENTRIES (Structured Demo Data)
// Note: Times match TIME_SLOTS:
// P1: 08:30 - 09:20
// P2: 09:20 - 10:10
// Morning Break: 10:10 - 10:30
// P3: 10:30 - 11:20
// P4: 11:20 - 12:10
// Lunch Break: 12:10 - 13:00
// P5: 13:00 - 13:50
// P6: 13:50 - 14:40
// P7: 14:40 - 15:30
// P8: 15:30 - 16:20

export const INITIAL_TIMETABLES: TimetableEntry[] = [
  // MONDAY - Section CSE-3A
  {
    id: 'tt-1',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-ml',
    facultyId: 'fac-1', // Dr. K. Radhakrishna
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Monday',
    startTime: '08:30',
    endTime: '09:20',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-2',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-cn',
    facultyId: 'fac-3', // Prof. M. Venkat Rao
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Monday',
    startTime: '09:20',
    endTime: '10:10',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-3',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-web',
    facultyId: 'fac-4', // Dr. Ananya Sen
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Monday',
    startTime: '10:30',
    endTime: '11:20',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-4',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-cloud',
    facultyId: 'fac-3', // Prof. M. Venkat Rao
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Monday',
    startTime: '11:20',
    endTime: '12:10',
    isLab: false,
    status: 'published'
  },
  // Monday Afternoon Lab for CSE-3A (2 consecutive periods: 13:00 - 14:40)
  {
    id: 'tt-5',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-ml-lab',
    facultyId: 'fac-1', // Dr. K. Radhakrishna
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-lab1',
    day: 'Monday',
    startTime: '13:00',
    endTime: '14:40',
    isLab: true,
    status: 'published'
  },

  // MONDAY - Section AIML-2A (In Nagarjuna Block N-204 & N-Lab 101)
  {
    id: 'tt-6',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-aiml',
    yearOfStudy: 2,
    sectionId: 'sec-aiml-2a',
    subjectId: 'sub-ai-nlp',
    facultyId: 'fac-2', // Dr. S. Priya
    buildingId: 'bldg-3',
    floorId: 'flr-n-2',
    roomId: 'room-n-204',
    day: 'Monday',
    startTime: '08:30',
    endTime: '09:20',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-7',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-aiml',
    yearOfStudy: 2,
    sectionId: 'sec-aiml-2a',
    subjectId: 'sub-ai-lab',
    facultyId: 'fac-2', // Dr. S. Priya
    buildingId: 'bldg-3',
    floorId: 'flr-n-1',
    roomId: 'room-n-lab1',
    day: 'Monday',
    startTime: '10:30',
    endTime: '12:10',
    isLab: true,
    status: 'published'
  },

  // MONDAY - Section ECE-3A (In H Block H-101 & H-Lab 101)
  {
    id: 'tt-8',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-ece',
    yearOfStudy: 3,
    sectionId: 'sec-ece-3a',
    subjectId: 'sub-vlsi',
    facultyId: 'fac-5', // Dr. G. Venkata Raman
    buildingId: 'bldg-4',
    floorId: 'flr-h-1',
    roomId: 'room-h-101',
    day: 'Monday',
    startTime: '08:30',
    endTime: '10:10',
    isLab: false,
    status: 'published'
  },

  // TUESDAY - Section CSE-3A
  {
    id: 'tt-9',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-cloud',
    facultyId: 'fac-3',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Tuesday',
    startTime: '08:30',
    endTime: '09:20',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-10',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-ml',
    facultyId: 'fac-1',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Tuesday',
    startTime: '09:20',
    endTime: '10:10',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-11',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-web',
    facultyId: 'fac-4',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Tuesday',
    startTime: '10:30',
    endTime: '11:20',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-12',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-cn',
    facultyId: 'fac-3',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Tuesday',
    startTime: '13:00',
    endTime: '13:50',
    isLab: false,
    status: 'published'
  },

  // WEDNESDAY - Section CSE-3A
  {
    id: 'tt-13',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-ml',
    facultyId: 'fac-1',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Wednesday',
    startTime: '08:30',
    endTime: '09:20',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-14',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-web',
    facultyId: 'fac-4',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Wednesday',
    startTime: '09:20',
    endTime: '10:10',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-15',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-cn',
    facultyId: 'fac-3',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Wednesday',
    startTime: '10:30',
    endTime: '11:20',
    isLab: false,
    status: 'published'
  },

  // THURSDAY - Section CSE-3A
  {
    id: 'tt-16',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-cloud',
    facultyId: 'fac-3',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Thursday',
    startTime: '08:30',
    endTime: '09:20',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-17',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-ml',
    facultyId: 'fac-1',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Thursday',
    startTime: '09:20',
    endTime: '10:10',
    isLab: false,
    status: 'published'
  },

  // FRIDAY - Section CSE-3A
  {
    id: 'tt-18',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-web',
    facultyId: 'fac-4',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Friday',
    startTime: '08:30',
    endTime: '09:20',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-19',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-cn',
    facultyId: 'fac-3',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Friday',
    startTime: '09:20',
    endTime: '10:10',
    isLab: false,
    status: 'published'
  },
  {
    id: 'tt-20',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-cloud',
    facultyId: 'fac-3',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Friday',
    startTime: '10:30',
    endTime: '11:20',
    isLab: false,
    status: 'published'
  },

  // SATURDAY - Section CSE-3A
  {
    id: 'tt-21',
    academicYearId: 'ay-2026-2027',
    semesterId: 'sem-2026-even',
    departmentId: 'dept-cse',
    yearOfStudy: 3,
    sectionId: 'sec-cse-3a',
    subjectId: 'sub-ml',
    facultyId: 'fac-1',
    buildingId: 'bldg-1',
    floorId: 'flr-a-1',
    roomId: 'room-a-101',
    day: 'Saturday',
    startTime: '09:20',
    endTime: '11:20',
    isLab: false,
    status: 'published'
  }
];

export const INITIAL_CHANGES: TimetableChange[] = [
  {
    id: 'tc-1',
    timetableEntryId: 'tt-1',
    changeType: 'Room Changed',
    previousValue: 'Room A-103',
    updatedValue: 'Room A-101',
    reason: 'Smart Podium system upgrade and larger seating capacity requirement for CSE-3A.',
    updatedBy: 'Prof. Academic Coordinator',
    updatedAt: '2026-11-01T10:00:00Z',
    effectiveDate: '2026-11-03',
    affectedSectionId: 'sec-cse-3a',
    affectedFacultyId: 'fac-1'
  },
  {
    id: 'tc-2',
    timetableEntryId: 'tt-6',
    changeType: 'Timing Shifted',
    previousValue: '09:20 - 10:10',
    updatedValue: '08:30 - 09:20',
    reason: 'Alignment with High Performance Computing Lab slot in Nagarjuna Block.',
    updatedBy: 'HOD AI & ML',
    updatedAt: '2026-11-02T14:30:00Z',
    effectiveDate: '2026-11-04',
    affectedSectionId: 'sec-aiml-2a',
    affectedFacultyId: 'fac-2'
  }
];

export const INITIAL_NOTIFICATIONS: UserNotification[] = [
  {
    id: 'notif-1',
    title: 'Even Semester Academic Timetable Published',
    message: 'Official timetable for Academic Year 2026-2027 (Even Semester) has been published for all departments.',
    type: 'timetable_published',
    targetRole: 'all',
    createdAt: '2026-11-01T08:00:00Z',
    isRead: false,
    link: '/timetable'
  },
  {
    id: 'notif-2',
    title: 'Classroom Reassignment: Section CSE-3A',
    message: 'Machine Learning lecture on Mondays has been moved from A-103 to Room A-101.',
    type: 'room_change',
    targetRole: 'student',
    targetUserId: 'stud-1',
    createdAt: '2026-11-02T11:00:00Z',
    isRead: false,
    link: '/student/timetable'
  },
  {
    id: 'notif-3',
    title: 'GPU Computing Lab Availability Verified',
    message: 'N-Lab 101 in Nagarjuna Block has completed scheduled maintenance and is ready for DL practical sessions.',
    type: 'general',
    targetRole: 'faculty',
    targetUserId: 'fac-2',
    createdAt: '2026-11-03T16:00:00Z',
    isRead: true,
    link: '/faculty/availability'
  }
];

