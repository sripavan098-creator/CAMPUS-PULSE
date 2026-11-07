import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Info,
  Layers,
  Sparkles,
  Compass,
  Building,
  CheckCircle2,
  Clock,
  DoorOpen
} from 'lucide-react';
import { Building as BuildingType, Floor, Room, AvailabilityStatus } from '../../types';
import { timetableService } from '../../services/timetableService';

interface FloorBlueprintProps {
  building: BuildingType;
  floor: Floor;
  rooms: Room[];
  selectedRoomId?: string;
  selectedDay: string;
  selectedTime: string;
  onSelectRoom: (room: Room) => void;
}

export const FloorBlueprint: React.FC<FloorBlueprintProps> = ({
  building,
  floor,
  rooms,
  selectedRoomId,
  selectedDay,
  selectedTime,
  onSelectRoom
}) => {
  const [zoom, setZoom] = useState(1);
  const [filterQuery, setFilterQuery] = useState('');

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 1.8));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.7));
  const handleResetZoom = () => setZoom(1);

  // Status color mapper
  const getRoomStatusColor = (roomId?: string): {
    bg: string;
    border: string;
    text: string;
    badge: string;
    status: AvailabilityStatus;
  } => {
    if (!roomId) {
      return {
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        text: 'text-slate-600',
        badge: 'Facility',
        status: 'unavailable'
      };
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.isSchedulable) {
      return {
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        text: 'text-slate-600',
        badge: 'Facility',
        status: 'unavailable'
      };
    }

    const { status } = timetableService.getRoomStatus(room.id, selectedDay as any, selectedTime);

    switch (status) {
      case 'occupied':
        return {
          bg: 'bg-red-50 hover:bg-red-100/90',
          border: 'border-red-400',
          text: 'text-red-900',
          badge: 'Occupied',
          status: 'occupied'
        };
      case 'upcoming':
        return {
          bg: 'bg-blue-50 hover:bg-blue-100/90',
          border: 'border-blue-400',
          text: 'text-blue-900',
          badge: 'Upcoming',
          status: 'upcoming'
        };
      case 'available':
      default:
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100/90',
          border: 'border-emerald-400',
          text: 'text-emerald-900',
          badge: 'Available',
          status: 'available'
        };
    }
  };

  const isGroundFloor = floor.floorNumber === 0;
  const hasClassrooms = floor.roomIds && floor.roomIds.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Blueprint Header & Controls */}
      <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-300">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                2D Architectural Blueprint • {floor.name}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                DEMO LAYOUT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {building.name} ({building.originalCode}) • Top-down Spatial View
            </p>
          </div>
        </div>

        {/* Blueprint Controls */}
        <div className="flex items-center gap-2">
          {/* Room quick search inside floor */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter rooms on floor..."
              className="pl-8 pr-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36"
            />
          </div>

          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-300">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors ml-1 border-l border-slate-700"
              title="Fit to view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ground Floor Special Banner if no classrooms */}
      {isGroundFloor && !hasClassrooms && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Ground Floor Notice:</strong> Regular teaching classrooms are not located on the ground floor. Only administrative offices, reception, entrance colonnade, and vertical conduits are registered.
            </span>
          </div>
          <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
            No Classrooms on Ground
          </span>
        </div>
      )}

      {/* Blueprint Drawing Canvas */}
      <div className="relative w-full bg-[#0F172A] overflow-auto min-h-[460px] p-6 flex items-center justify-center">
        {/* Subtle grid background simulating architectural blueprints */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #38BDF8 1px, transparent 1px), linear-gradient(to bottom, #38BDF8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Scaled Blueprint Container */}
        <div
          className="relative w-full max-w-4xl aspect-[16/10] bg-slate-900/90 border-2 border-dashed border-cyan-500/40 rounded-xl p-4 shadow-2xl transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {/* Compass Rose */}
          <div className="absolute top-3 right-3 text-cyan-400/50 flex flex-col items-center pointer-events-none text-[10px] font-mono">
            <span>▲ N</span>
            <span className="text-[8px]">VFSTR PLAN</span>
          </div>

          {/* Blueprint Elements */}
          {(floor.blueprintElements || []).map(elem => {
            const isRoom = !!elem.roomId;
            const targetRoom = isRoom ? rooms.find(r => r.id === elem.roomId) : undefined;
            const isSelected = isRoom && elem.roomId === selectedRoomId;
            const statusStyle = isRoom ? getRoomStatusColor(elem.roomId) : null;

            // Highlight matches if query typed
            const matchesQuery =
              filterQuery.trim() === '' ||
              elem.label.toLowerCase().includes(filterQuery.toLowerCase()) ||
              elem.name.toLowerCase().includes(filterQuery.toLowerCase());

            // Non-room facilities styling
            if (!isRoom) {
              const isCourtyard = elem.type === 'courtyard';
              const isCorridor = elem.type === 'corridor';
              const isEntrance = elem.type === 'entrance';
              const isLift = elem.type === 'lift';
              const isStairs = elem.type === 'staircase';

              return (
                <div
                  key={elem.id}
                  style={{
                    left: `${elem.x}%`,
                    top: `${elem.y}%`,
                    width: `${elem.width}%`,
                    height: `${elem.height}%`
                  }}
                  className={`absolute rounded-lg flex flex-col items-center justify-center text-center p-1 border transition-all ${
                    isCourtyard
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                      : isCorridor
                      ? 'bg-slate-800/60 border-slate-700/60 text-slate-400 text-[10px]'
                      : isEntrance
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 font-bold'
                      : isLift
                      ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                      : isStairs
                      ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-semibold tracking-wide">
                    {elem.label}
                  </span>
                  {elem.name !== elem.label && (
                    <span className="text-[9px] opacity-75 truncate max-w-full px-1">
                      {elem.name}
                    </span>
                  )}
                </div>
              );
            }

            // Schedulable Room Block
            return (
              <div
                key={elem.id}
                onClick={() => targetRoom && onSelectRoom(targetRoom)}
                style={{
                  left: `${elem.x}%`,
                  top: `${elem.y}%`,
                  width: `${elem.width}%`,
                  height: `${elem.height}%`
                }}
                className={`absolute rounded-xl flex flex-col items-center justify-center p-2 text-center cursor-pointer border-2 transition-all duration-150 select-none shadow-md ${
                  isSelected
                    ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-900 z-20 scale-[1.03] ' +
                      (statusStyle?.bg || 'bg-white') + ' ' + (statusStyle?.border || 'border-blue-500')
                    : matchesQuery
                    ? `${statusStyle?.bg} ${statusStyle?.border} hover:scale-[1.02] hover:z-10`
                    : 'opacity-30 bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                {/* Room ID badge */}
                <span className="font-mono font-black text-xs sm:text-sm text-slate-900 tracking-tight">
                  {elem.label}
                </span>

                {/* Subtitle / Name */}
                <span className="text-[10px] font-medium text-slate-700 truncate max-w-full px-1 mt-0.5">
                  {targetRoom?.type === 'laboratory' ? 'Laboratory' : targetRoom?.type === 'seminar_hall' ? 'Seminar' : 'Classroom'}
                </span>

                {/* Live Status indicator */}
                <span
                  className={`mt-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                    statusStyle?.status === 'occupied'
                      ? 'bg-red-600 text-white'
                      : statusStyle?.status === 'upcoming'
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {statusStyle?.badge}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blueprint Legend & Status Bar */}
      <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Live Blueprint Legend:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600 inline-block shrink-0" />
            <span className="text-slate-700 font-medium">Available</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-600 inline-block shrink-0" />
            <span className="text-slate-700 font-medium">Currently Occupied</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-500 border border-blue-600 inline-block shrink-0" />
            <span className="text-slate-700 font-medium">Upcoming Class</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-300 border border-slate-400 inline-block shrink-0" />
            <span className="text-slate-700 font-medium">Facility / Common</span>
          </div>
        </div>

        <div className="text-slate-500 text-[11px] font-medium">
          Click any rectangular room block to inspect full timetable and faculty details
        </div>
      </div>
    </div>
  );
};

