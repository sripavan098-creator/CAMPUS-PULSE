import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Building2,
  BookOpen,
  User,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { timetableService } from '../../services/timetableService';
import { Room, Faculty, Subject, Building, Department, Section } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        apiService.getRooms().catch(() => []),
        apiService.getFaculty().catch(() => []),
        apiService.getSubjects().catch(() => []),
        apiService.getBuildings().catch(() => []),
        apiService.getDepartments().catch(() => []),
        apiService.getSections().catch(() => [])
      ]).then(([rms, facs, subjs, bldgs, depts, secs]) => {
        setRooms(rms);
        setFaculty(facs);
        setSubjects(subjs);
        setBuildings(bldgs);
        setDepartments(depts);
        setSections(secs);
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open
          const event = new CustomEvent('open_global_search');
          window.dispatchEvent(event);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleHardwareBack = (e: Event) => {
      if (isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('campus_pulse_hardware_back', handleHardwareBack);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('campus_pulse_hardware_back', handleHardwareBack);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const filteredRooms = trimmed
    ? rooms.filter(
        r =>
          r.roomNumber.toLowerCase().includes(trimmed) ||
          r.name.toLowerCase().includes(trimmed) ||
          r.type.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const filteredFaculty = trimmed
    ? faculty.filter(
        f =>
          f.name.toLowerCase().includes(trimmed) ||
          f.facultyId.toLowerCase().includes(trimmed) ||
          f.email.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const filteredSubjects = trimmed
    ? subjects.filter(
        s =>
          s.name.toLowerCase().includes(trimmed) ||
          s.code.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const filteredBuildings = trimmed
    ? buildings.filter(
        b =>
          b.name.toLowerCase().includes(trimmed) ||
          b.originalCode.toLowerCase().includes(trimmed)
      ).slice(0, 3)
    : [];

  const deptCodeById = new Map(departments.map(d => [d.id, d.code]));

  const filteredSections = trimmed
    ? sections.filter(
        s =>
          s.name.toLowerCase().includes(trimmed) ||
          (deptCodeById.get(s.departmentId) || '').toLowerCase().includes(trimmed)
      ).slice(0, 5)
    : [];

  const hasResults =
    filteredRooms.length > 0 ||
    filteredFaculty.length > 0 ||
    filteredSubjects.length > 0 ||
    filteredBuildings.length > 0 ||
    filteredSections.length > 0;

  const handleSelectRoom = (room: Room) => {
    const bldg = buildings.find(b => b.id === room.buildingId);
    onClose();
    if (bldg) {
      navigate(`/campus/${bldg.slug}?floor=${room.floorId}&room=${room.id}`);
    } else {
      navigate('/campus');
    }
  };

  const handleSelectFaculty = (fac: Faculty) => {
    onClose();
    navigate(`/availability?resourceType=faculty&search=${encodeURIComponent(fac.name)}`);
  };

  const handleSelectSubject = (subj: Subject) => {
    onClose();
    navigate(`/timetable?search=${encodeURIComponent(subj.code)}`);
  };

  const handleSelectBuilding = (bldg: Building) => {
    onClose();
    navigate(`/campus/${bldg.slug}`);
  };

  const handleSelectSection = (sec: Section) => {
    onClose();
    navigate(`/timetable?section=${encodeURIComponent(sec.id)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search room (N-204, A-101), faculty, subject, building, or section..."
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-slate-500 bg-slate-200/80 rounded border border-slate-300">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto text-blue-400 mb-2 opacity-60" />
              <p className="text-sm font-medium text-slate-600">Quick Universal Campus Search</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try searching for <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => setQuery('N-204')}>N-204</span>, <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => setQuery('Radhakrishna')}>Dr. Radhakrishna</span>, or <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => setQuery('Machine Learning')}>Machine Learning</span>.
              </p>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm font-medium text-slate-600">No matching campus records found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by room number (e.g. A-101), faculty name, or department.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Rooms */}
              {filteredRooms.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> Classrooms & Labs ({filteredRooms.length})
                  </div>
                  <div className="space-y-1">
                    {filteredRooms.map(r => {
                      const bldg = buildings.find(b => b.id === r.buildingId);
                      const status = timetableService.getRoomStatus(r.id, 'Monday', '10:00');
                      return (
                        <div
                          key={r.id}
                          onClick={() => handleSelectRoom(r)}
                          className="flex items-center justify-between p-2.5 hover:bg-blue-50/70 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-blue-100"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800 group-hover:text-blue-700 bg-slate-100 px-2 py-0.5 rounded text-sm font-mono">
                              {r.roomNumber}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{r.name}</p>
                              <p className="text-xs text-slate-500">{bldg?.name || 'Building'} • Capacity: {r.capacity}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              status.status === 'occupied'
                                ? 'bg-red-100 text-red-700'
                                : status.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {status.status}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Faculty */}
              {filteredFaculty.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-500" /> Faculty Members ({filteredFaculty.length})
                  </div>
                  <div className="space-y-1">
                    {filteredFaculty.map(f => {
                      const dept = departments.find(d => d.id === f.departmentId);
                      return (
                        <div
                          key={f.id}
                          onClick={() => handleSelectFaculty(f)}
                          className="flex items-center justify-between p-2.5 hover:bg-teal-50/70 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-teal-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                              {f.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-800">{f.name}</p>
                              <p className="text-xs text-slate-500">{f.designation} • {dept?.name || 'Department'}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">{f.facultyId}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buildings */}
              {filteredBuildings.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Campus Buildings ({filteredBuildings.length})
                  </div>
                  <div className="space-y-1">
                    {filteredBuildings.map(b => (
                      <div
                        key={b.id}
                        onClick={() => handleSelectBuilding(b)}
                        className="flex items-center justify-between p-2.5 hover:bg-indigo-50/70 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-indigo-100"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={b.imageUrl}
                            alt={b.name}
                            className="w-10 h-8 rounded object-cover border border-slate-200"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-800">{b.name}</p>
                            <p className="text-xs text-slate-500">{b.originalCode} • {b.totalFloors} Registered Floors</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections */}
              {filteredSections.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" /> Sections ({filteredSections.length})
                  </div>
                  <div className="space-y-1">
                    {filteredSections.map(sec => (
                      <div
                        key={sec.id}
                        onClick={() => handleSelectSection(sec)}
                        className="flex items-center justify-between p-2.5 hover:bg-blue-50/70 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-blue-100"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-800">{sec.name}</p>
                          <p className="text-xs text-slate-500">
                            {deptCodeById.get(sec.departmentId) || 'Department'} • Year {sec.yearOfStudy} • {sec.totalStudents} students
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Subjects */}
              {filteredSubjects.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Academic Subjects ({filteredSubjects.length})
                  </div>
                  <div className="space-y-1">
                    {filteredSubjects.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSubject(s)}
                        className="flex items-center justify-between p-2.5 hover:bg-purple-50/70 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-purple-100"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-purple-800">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.code} • {s.type} Course • {s.credits} Credits</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-100/70 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-300">ESC</kbd> to exit</span>
            <span>•</span>
            <span>Press <kbd className="font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-300">Ctrl + K</kbd> to open anytime</span>
          </div>
          <span className="font-medium text-slate-600">Vignan Campus Pulse</span>
        </div>
      </div>
    </div>
  );
};

