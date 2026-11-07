import React, { useEffect } from 'react';
import {
  X,
  Clock,
  User,
  Users,
  BookOpen,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock3
} from 'lucide-react';
import { Room, Building, Floor } from '../../types';
import { timetableService } from '../../services/timetableService';
import { storageService } from '../../services/storageService';
import { useLookups } from '../../hooks/useLookups';
import { formatTime12h, TIME_SLOTS } from '../../utils/timeUtils';

interface RoomDetailModalProps {
  room: Room | null;
  building: Building | null;
  floor: Floor | null;
  selectedDay?: string;
  selectedTime?: string;
  onClose: () => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  building,
  floor,
  selectedDay = 'Monday',
  selectedTime = '10:00',
  onClose
}) => {
  if (!room) return null;

  const statusInfo = timetableService.getRoomStatus(room.id, selectedDay as any, selectedTime);
  const fullSchedule = timetableService.getRoomSchedule(room.id, selectedDay as any);

  const { departments, subjects, faculty: facultyList, sections } = useLookups();

  const dept = departments.find(d => d.id === room.departmentId);
  const getSubj = (id?: string) => subjects.find(s => s.id === id);
  const getFac = (id?: string) => facultyList.find(f => f.id === id || f.name === id);
  const getSec = (id?: string) => sections.find(s => s.id === id);

  const currentSubj = getSubj(statusInfo.currentEntry?.subjectId);
  const currentFaculty = getFac(statusInfo.currentEntry?.facultyId);
  const currentSec = getSec(statusInfo.currentEntry?.sectionId);

  const nextSubj = getSubj(statusInfo.nextEntry?.subjectId);
  const nextFaculty = getFac(statusInfo.nextEntry?.facultyId);
  const nextSec = getSec(statusInfo.nextEntry?.sectionId);

  useEffect(() => {
    const handleHardwareBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('campus_pulse_hardware_back', handleHardwareBack);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('campus_pulse_hardware_back', handleHardwareBack);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#142B4A] text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black font-mono tracking-tight bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/20">
                {room.roomNumber}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  statusInfo.status === 'occupied'
                    ? 'bg-red-500 text-white'
                    : statusInfo.status === 'upcoming'
                    ? 'bg-blue-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {statusInfo.status === 'occupied' ? 'Currently Occupied' : statusInfo.status === 'upcoming' ? 'Class Upcoming' : 'Available Now'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-2">{room.name}</h3>
            <p className="text-xs text-blue-200/80 flex items-center gap-2 mt-0.5">
              <span>{building?.name || 'Building'} ({building?.originalCode})</span>
              <span>•</span>
              <span>{floor?.name || 'Floor'}</span>
              <span>•</span>
              <span className="capitalize">{room.type}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Specs Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Department</span>
              <p className="text-sm font-bold text-slate-800">{dept?.code || 'General'}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Capacity</span>
              <p className="text-sm font-bold text-slate-800">{room.capacity} Seats</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Selected Day</span>
              <p className="text-sm font-bold text-slate-800">{selectedDay}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Next Free</span>
              <p className="text-sm font-bold text-blue-600 truncate">{statusInfo.nextAvailableTime}</p>
            </div>
          </div>

          {/* Current Class Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Current Session Status ({selectedTime})
            </h4>

            {statusInfo.currentEntry ? (
              <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-3 mb-3">
                  <div>
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Ongoing Class</span>
                    <h5 className="text-base font-extrabold text-slate-900 mt-0.5">{currentSubj?.name || 'Class Subject'}</h5>
                    <p className="text-xs text-slate-500 font-mono">{currentSubj?.code}</p>
                  </div>
                  <div className="text-right sm:shrink-0">
                    <span className="inline-block px-2.5 py-1 bg-red-100 text-red-800 font-bold text-xs rounded-lg font-mono">
                      {statusInfo.currentEntry.startTime} - {statusInfo.currentEntry.endTime}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Faculty Instructor:</span>
                    <p className="font-semibold text-slate-800">{currentFaculty?.name || 'Assigned Faculty'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Attending Section:</span>
                    <p className="font-semibold text-slate-800">{currentSec?.name || 'Section'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Finishes At:</span>
                    <p className="font-bold text-emerald-700">{formatTime12h(statusInfo.currentEntry.endTime)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h5 className="text-sm font-bold text-emerald-900">Room is currently vacant & available</h5>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    No active academic schedule occupying this room at {selectedTime}.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Class */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-amber-500" /> Next Scheduled Class Today
            </h4>

            {statusInfo.nextEntry ? (
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">Upcoming at {statusInfo.nextEntry.startTime}</span>
                  <h5 className="text-sm font-bold text-slate-900 mt-0.5">{nextSubj?.name}</h5>
                  <p className="text-xs text-slate-500">
                    Faculty: {nextFaculty?.name} • Section: {nextSec?.name}
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-lg font-mono">
                    {statusInfo.nextEntry.startTime} - {statusInfo.nextEntry.endTime}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                No further classes scheduled for the remainder of {selectedDay}.
              </p>
            )}
          </div>

          {/* Daily Schedule Timeline (08:30 to 16:30) */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" /> {selectedDay} Room Schedule
            </h4>

            <div className="space-y-1.5">
              {fullSchedule.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg text-center">
                  No classes scheduled on this day. Room is free throughout the day.
                </p>
              ) : (
                fullSchedule.map(entry => {
                  const s = getSubj(entry.subjectId);
                  const f = getFac(entry.facultyId);
                  const sec = getSec(entry.sectionId);
                  const isCurrent = statusInfo.currentEntry?.id === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                        isCurrent
                          ? 'bg-red-50 border-red-300 font-medium'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {entry.startTime} - {entry.endTime}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800">{s?.name}</p>
                          <p className="text-slate-500 text-[11px]">
                            {f?.name} • Section {sec?.name}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCurrent ? 'bg-red-200 text-red-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isCurrent ? 'Ongoing' : 'Scheduled'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Features / Equipment */}
          {room.features && room.features.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Room Features & Facilities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {room.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">VFSTR Resource ID: {room.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

