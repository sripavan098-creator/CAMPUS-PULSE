import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Eye
} from 'lucide-react';
import { Room, Building, Floor } from '../../types';
import { timetableService } from '../../services/timetableService';
import { storageService } from '../../services/storageService';
import { useLookups } from '../../hooks/useLookups';

interface FloorResourceTableProps {
  building: Building;
  floor: Floor;
  rooms: Room[];
  selectedRoomId?: string;
  selectedDay: string;
  selectedTime: string;
  onSelectRoom: (room: Room) => void;
}

export const FloorResourceTable: React.FC<FloorResourceTableProps> = ({
  building,
  floor,
  rooms,
  selectedRoomId,
  selectedDay,
  selectedTime,
  onSelectRoom
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied' | 'upcoming' | 'laboratories'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { departments, subjects, faculty: facultyList, sections } = useLookups();

  const getSubj = (id?: string) => subjects.find(s => s.id === id);
  const getFac = (id?: string) => facultyList.find(f => f.id === id);
  const getSec = (id?: string) => sections.find(s => s.id === id);

  // Compute status for all floor rooms
  const roomsWithData = rooms.map(room => {
    const statusInfo = timetableService.getRoomStatus(room.id, selectedDay as any, selectedTime);
    const currSubj = getSubj(statusInfo.currentEntry?.subjectId);
    const currFac = getFac(statusInfo.currentEntry?.facultyId);
    const currSec = getSec(statusInfo.currentEntry?.sectionId);

    const nextSubj = getSubj(statusInfo.nextEntry?.subjectId);
    const nextFac = getFac(statusInfo.nextEntry?.facultyId);

    return {
      room,
      statusInfo,
      currSubj,
      currFac,
      currSec,
      nextSubj,
      nextFac
    };
  });

  const filtered = roomsWithData.filter(({ room, statusInfo }) => {
    // Filter status
    if (filterStatus === 'available' && statusInfo.status !== 'available') return false;
    if (filterStatus === 'occupied' && statusInfo.status !== 'occupied') return false;
    if (filterStatus === 'upcoming' && statusInfo.status !== 'upcoming') return false;
    if (filterStatus === 'laboratories' && room.type !== 'laboratory') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = room.roomNumber.toLowerCase().includes(q);
      const matchName = room.name.toLowerCase().includes(q);
      return matchNumber || matchName;
    }

    return true;
  });

  if (floor.floorNumber === 0 && rooms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800">No Registered Classrooms on Ground Floor</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          As per university architectural design, teaching classrooms are configured on upper floors. Ground floor facilities are reserved for entrances, receptions, security, and administrative wings.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header & Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h4 className="text-base font-bold text-[#142B4A]">
            {floor.name} • Room Availability & Schedule Roster
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized live with the 2D blueprint above. Click any row to highlight and inspect.
          </p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status buttons */}
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs">
            {(['all', 'available', 'occupied', 'upcoming', 'laboratories'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                  filterStatus === tab
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search room..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Room No.</th>
              <th className="py-3 px-4">Room Type</th>
              <th className="py-3 px-4">Current Status</th>
              <th className="py-3 px-4">Current Subject</th>
              <th className="py-3 px-4">Faculty</th>
              <th className="py-3 px-4">Section</th>
              <th className="py-3 px-4">Slot</th>
              <th className="py-3 px-4">Next Class</th>
              <th className="py-3 px-4">Next Free</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  No rooms match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map(({ room, statusInfo, currSubj, currFac, currSec, nextSubj, nextFac }) => {
                const isSelected = room.id === selectedRoomId;

                return (
                  <tr
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/90 font-medium'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Room No. */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {room.roomNumber}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-700">
                        {room.type === 'laboratory' ? 'Laboratory' : room.type === 'seminar_hall' ? 'Seminar Hall' : 'Classroom'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          statusInfo.status === 'occupied'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : statusInfo.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {statusInfo.status}
                      </span>
                    </td>

                    {/* Current Subject */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {currSubj ? currSubj.name : <span className="text-slate-400 font-normal italic">— Vacant —</span>}
                    </td>

                    {/* Faculty */}
                    <td className="py-3 px-4 text-slate-700">
                      {currFac ? currFac.name : <span className="text-slate-400">—</span>}
                    </td>

                    {/* Section */}
                    <td className="py-3 px-4">
                      {currSec ? (
                        <span className="bg-slate-200/80 px-2 py-0.5 rounded font-mono font-bold text-slate-700 text-[11px]">
                          {currSec.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Slot */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {statusInfo.currentEntry ? (
                        `${statusInfo.currentEntry.startTime} - ${statusInfo.currentEntry.endTime}`
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Next Class */}
                    <td className="py-3 px-4 text-slate-700">
                      {nextSubj ? (
                        <span className="truncate block max-w-[140px]" title={`${nextSubj.name} (${statusInfo.nextEntry?.startTime})`}>
                          {nextSubj.name} <span className="text-blue-600 font-mono text-[10px]">({statusInfo.nextEntry?.startTime})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">None remaining</span>
                      )}
                    </td>

                    {/* Next Free */}
                    <td className="py-3 px-4 font-medium text-emerald-700 font-mono">
                      {statusInfo.nextAvailableTime}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectRoom(room);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Full Schedule"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

