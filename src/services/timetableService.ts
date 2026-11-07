import { storageService } from './storageService';
import { api } from './api';
import {
  DayOfWeek,
  ResourceAvailabilityItem,
  Room,
  TimetableEntry,
  AvailabilityStatus
} from '../types';
import {
  doIntervalsOverlap,
  formatTime12h,
  minutesToTime,
  timeToMinutes
} from '../utils/timeUtils';

export const timetableService = {
  // Get active published timetable entries
  getPublishedTimetables(): TimetableEntry[] {
    return storageService.getTimetables().filter(t => t.status === 'published');
  },

  // Get student schedule
  getStudentSchedule(sectionId: string, day?: DayOfWeek): TimetableEntry[] {
    const published = this.getPublishedTimetables().filter(t => t.sectionId === sectionId);
    if (!day) {
      return published.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    }
    return published.filter(t => t.day === day).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  },

  // Get faculty schedule
  getFacultySchedule(facultyId: string, day?: DayOfWeek): TimetableEntry[] {
    const published = this.getPublishedTimetables().filter(t => t.facultyId === facultyId);
    if (!day) {
      return published.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    }
    return published.filter(t => t.day === day).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  },

  // Get room schedule
  getRoomSchedule(roomId: string, day?: DayOfWeek): TimetableEntry[] {
    const published = this.getPublishedTimetables().filter(t => t.roomId === roomId);
    if (!day) {
      return published.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    }
    return published.filter(t => t.day === day).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  },

  // Calculate current status for a room at specific day and time
  getRoomStatus(
    roomId: string,
    day: DayOfWeek,
    time: string
  ): {
    status: AvailabilityStatus;
    currentEntry?: TimetableEntry;
    nextEntry?: TimetableEntry;
    nextAvailableTime: string;
  } {
    const schedule = this.getRoomSchedule(roomId, day);
    const targetMin = timeToMinutes(time);

    let currentEntry: TimetableEntry | undefined;
    let nextEntry: TimetableEntry | undefined;

    for (const entry of schedule) {
      const startMin = timeToMinutes(entry.startTime);
      const endMin = timeToMinutes(entry.endTime);

      if (targetMin >= startMin && targetMin < endMin) {
        currentEntry = entry;
      } else if (startMin > targetMin) {
        if (!nextEntry || startMin < timeToMinutes(nextEntry.startTime)) {
          nextEntry = entry;
        }
      }
    }

    if (currentEntry) {
      return {
        status: 'occupied',
        currentEntry,
        nextEntry,
        nextAvailableTime: currentEntry.endTime
      };
    }

    if (nextEntry && timeToMinutes(nextEntry.startTime) - targetMin <= 30) {
      return {
        status: 'upcoming',
        nextEntry,
        nextAvailableTime: 'Now until ' + nextEntry.startTime
      };
    }

    return {
      status: 'available',
      nextEntry,
      nextAvailableTime: nextEntry ? `Until ${nextEntry.startTime}` : 'Available all day'
    };
  },

  // Calculate status for faculty at specific day and time
  getFacultyStatus(
    facultyId: string,
    day: DayOfWeek,
    time: string
  ): {
    status: AvailabilityStatus;
    currentEntry?: TimetableEntry;
    nextEntry?: TimetableEntry;
    nextAvailableTime: string;
  } {
    const schedule = this.getFacultySchedule(facultyId, day);
    const targetMin = timeToMinutes(time);

    let currentEntry: TimetableEntry | undefined;
    let nextEntry: TimetableEntry | undefined;

    for (const entry of schedule) {
      const startMin = timeToMinutes(entry.startTime);
      const endMin = timeToMinutes(entry.endTime);

      if (targetMin >= startMin && targetMin < endMin) {
        currentEntry = entry;
      } else if (startMin > targetMin) {
        if (!nextEntry || startMin < timeToMinutes(nextEntry.startTime)) {
          nextEntry = entry;
        }
      }
    }

    if (currentEntry) {
      return {
        status: 'occupied',
        currentEntry,
        nextEntry,
        nextAvailableTime: currentEntry.endTime
      };
    }

    if (nextEntry && timeToMinutes(nextEntry.startTime) - targetMin <= 30) {
      return {
        status: 'upcoming',
        nextEntry,
        nextAvailableTime: 'Free until ' + nextEntry.startTime
      };
    }

    return {
      status: 'available',
      nextEntry,
      nextAvailableTime: nextEntry ? `Free until ${nextEntry.startTime}` : 'Available all day'
    };
  },

  // Calculate Smart Availability List for hackathon module
  calculateAvailability(params: {
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    resourceType: 'all' | 'classrooms' | 'laboratories' | 'faculty';
    buildingId?: string;
    floorId?: string;
    departmentId?: string;
  }): ResourceAvailabilityItem[] {
    const results: ResourceAvailabilityItem[] = [];
    const { day, startTime, endTime, resourceType, buildingId, floorId, departmentId } = params;

    const buildings = storageService.getBuildings();
    const floors = storageService.getFloors();
    const departments = storageService.getDepartments();
    const subjects = storageService.getSubjects();
    const facultyList = storageService.getFaculty();
    const sections = storageService.getSections();
    const rooms = storageService.getRooms();

    const getBldgName = (bId?: string) => buildings.find(b => b.id === bId)?.name || 'Campus Building';
    const getFlrName = (fId?: string) => floors.find(f => f.id === fId)?.name || 'Floor';
    const getDeptName = (dId?: string) => departments.find(d => d.id === dId)?.name || 'Department';
    const getSubjName = (sId?: string) => subjects.find(s => s.id === sId)?.name || 'Academic Class';
    const getFacName = (fId?: string) => facultyList.find(f => f.id === fId || f.name === fId)?.name || 'Faculty Member';
    const getSecName = (secId?: string) => sections.find(s => s.id === secId)?.name || 'Section';

    // 1. CLASSROOMS & LABORATORIES
    if (resourceType === 'all' || resourceType === 'classrooms' || resourceType === 'laboratories') {
      const filteredRooms = rooms.filter(r => {
        if (!r.isSchedulable) return false;
        if (resourceType === 'classrooms' && r.type !== 'classroom' && r.type !== 'seminar_hall') return false;
        if (resourceType === 'laboratories' && r.type !== 'laboratory') return false;
        if (buildingId && r.buildingId !== buildingId) return false;
        if (floorId && r.floorId !== floorId) return false;
        if (departmentId && r.departmentId !== departmentId) return false;
        return true;
      });

      for (const room of filteredRooms) {
        const schedule = this.getRoomSchedule(room.id, day);
        let isOccupied = false;
        let overlappingEntry: TimetableEntry | undefined;

        for (const entry of schedule) {
          if (doIntervalsOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
            isOccupied = true;
            overlappingEntry = entry;
            break;
          }
        }

        const roomStatusInfo = this.getRoomStatus(room.id, day, startTime);

        results.push({
          id: room.id,
          name: room.name,
          code: room.roomNumber,
          type: room.type === 'laboratory' ? 'laboratory' : 'classroom',
          buildingName: getBldgName(room.buildingId),
          floorName: getFlrName(room.floorId),
          departmentName: getDeptName(room.departmentId),
          status: isOccupied ? 'occupied' : 'available',
          capacity: room.capacity,
          currentActivity: overlappingEntry
            ? {
                subjectName: getSubjName(overlappingEntry.subjectId),
                facultyName: getFacName(overlappingEntry.facultyId),
                sectionName: getSecName(overlappingEntry.sectionId),
                startTime: overlappingEntry.startTime,
                endTime: overlappingEntry.endTime
              }
            : undefined,
          nextActivity: roomStatusInfo.nextEntry
            ? {
                subjectName: getSubjName(roomStatusInfo.nextEntry.subjectId),
                facultyName: getFacName(roomStatusInfo.nextEntry.facultyId),
                sectionName: getSecName(roomStatusInfo.nextEntry.sectionId),
                startTime: roomStatusInfo.nextEntry.startTime,
                endTime: roomStatusInfo.nextEntry.endTime
              }
            : undefined,
          nextAvailableTime: isOccupied && overlappingEntry ? overlappingEntry.endTime : 'Immediately'
        });
      }
    }

    // 2. FACULTY
    if (resourceType === 'all' || resourceType === 'faculty') {
      const filteredFaculty = facultyList.filter(f => {
        if (departmentId && f.departmentId !== departmentId) return false;
        return true;
      });

      for (const fac of filteredFaculty) {
        const schedule = this.getFacultySchedule(fac.id, day);
        let isOccupied = false;
        let overlappingEntry: TimetableEntry | undefined;

        for (const entry of schedule) {
          if (doIntervalsOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
            isOccupied = true;
            overlappingEntry = entry;
            break;
          }
        }

        const facStatusInfo = this.getFacultyStatus(fac.id, day, startTime);

        results.push({
          id: fac.id,
          name: fac.name,
          code: fac.facultyId,
          type: 'faculty',
          departmentName: getDeptName(fac.departmentId),
          status: isOccupied ? 'occupied' : 'available',
          currentActivity: overlappingEntry
            ? {
                subjectName: getSubjName(overlappingEntry.subjectId),
                sectionName: getSecName(overlappingEntry.sectionId),
                startTime: overlappingEntry.startTime,
                endTime: overlappingEntry.endTime
              }
            : undefined,
          nextActivity: facStatusInfo.nextEntry
            ? {
                subjectName: getSubjName(facStatusInfo.nextEntry.subjectId),
                sectionName: getSecName(facStatusInfo.nextEntry.sectionId),
                startTime: facStatusInfo.nextEntry.startTime,
                endTime: facStatusInfo.nextEntry.endTime
              }
            : undefined,
          nextAvailableTime: isOccupied && overlappingEntry ? overlappingEntry.endTime : 'Immediately'
        });
      }
    }

    return results;
  },

  // Calculate live campus metrics
  getCampusMetrics(day: DayOfWeek = 'Monday', time: string = '10:00') {
    const buildings = storageService.getBuildings();
    const floors = storageService.getFloors();
    const rooms = storageService.getRooms();
    const faculty = storageService.getFaculty();
    const timetables = this.getPublishedTimetables();

    const classrooms = rooms.filter(r => r.type === 'classroom' || r.type === 'seminar_hall');
    const labs = rooms.filter(r => r.type === 'laboratory');

    let occupiedRoomsCount = 0;
    rooms.forEach(r => {
      const status = this.getRoomStatus(r.id, day, time);
      if (status.status === 'occupied') occupiedRoomsCount++;
    });

    const availableRoomsCount = Math.max(0, rooms.length - occupiedRoomsCount);

    return {
      totalBuildings: buildings.length,
      totalFloors: floors.length,
      totalRooms: rooms.length,
      totalClassrooms: classrooms.length,
      totalLabs: labs.length,
      totalFaculty: faculty.length,
      totalScheduledClasses: timetables.length,
      occupiedRoomsCount,
      availableRoomsCount,
      utilizationPercentage: rooms.length ? Math.round((occupiedRoomsCount / rooms.length) * 100) : 0
    };
  },

  // API Backend Connectors
  async fetchAvailabilityNow(at?: string) {
    return api.get<{ day: string; time: string; rooms: any[] }>('/api/availability/now', {
      params: at ? { at } : undefined
    });
  },

  async fetchAvailabilitySearch(params: {
    day: string;
    from: string;
    to: string;
    block?: string;
    type?: string;
  }) {
    return api.get<{ day: string; from: string; to: string; count: number; rooms: any[] }>(
      '/api/availability/search',
      { params }
    );
  },

  async fetchRoomTimetable(roomId: string) {
    return api.get<{ room: any; entries: any[] }>(`/api/rooms/${roomId}/timetable`);
  },

  async fetchGroupTimetable(groupId: string) {
    return api.get<{ group: any; entries: any[] }>(`/api/groups/${groupId}/timetable`);
  },

  async fetchFacultyTimetable(facultyId: string) {
    return api.get<{ faculty: any; entries: any[] }>(`/api/faculty/${facultyId}/timetable`);
  }
};

