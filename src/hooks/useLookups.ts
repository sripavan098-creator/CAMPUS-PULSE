import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Subject, Faculty, Room, Building, Section, Department, Floor } from '../types';

export interface TimetableLookups {
  subjects: Subject[];
  faculty: Faculty[];
  rooms: Room[];
  buildings: Building[];
  sections: Section[];
  departments: Department[];
  floors: Floor[];
}

const EMPTY: TimetableLookups = {
  subjects: [],
  faculty: [],
  rooms: [],
  buildings: [],
  sections: [],
  departments: [],
  floors: []
};

// Presentational timetable/blueprint components each need the same lookup
// tables to turn an entry's ids into names. Sharing one in-flight request keeps
// a page with several grids from firing duplicate calls.
let cached: Promise<TimetableLookups> | null = null;

function loadLookups(): Promise<TimetableLookups> {
  if (!cached) {
    cached = Promise.all([
      apiService.getSubjects(),
      apiService.getFaculty(),
      apiService.getRooms(),
      apiService.getBuildings(),
      apiService.getSections(),
      apiService.getDepartments(),
      apiService.getFloors()
    ])
      .then(([subjects, faculty, rooms, buildings, sections, departments, floors]) => ({
        subjects, faculty, rooms, buildings, sections, departments, floors
      }))
      .catch(err => {
        cached = null;
        throw err;
      });
  }
  return cached;
}

export function useLookups(): TimetableLookups {
  const [lookups, setLookups] = useState<TimetableLookups>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    loadLookups()
      .then(data => {
        if (!cancelled) setLookups(data);
      })
      .catch(() => {
        /* components fall back to raw ids */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return lookups;
}
