import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { timetableService } from '../services/timetableService';
import { Building, Floor, Room } from '../types';
import { FloorBlueprint } from '../components/blueprint/FloorBlueprint';
import { FloorResourceTable } from '../components/blueprint/FloorResourceTable';
import { RoomDetailModal } from '../components/blueprint/RoomDetailModal';
import { DAYS_OF_WEEK } from '../utils/timeUtils';

export const BuildingDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [building, setBuilding] = useState<Building | undefined>(undefined);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Time & Day simulation
  const [simulatedDay, setSimulatedDay] = useState<string>('Monday');
  const [simulatedTime, setSimulatedTime] = useState<string>('10:00');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allBuildings = await apiService.getBuildings();
      const currentSlug = slug || 'nagarjuna-block';
      const foundBldg = allBuildings.find(b => b.slug === currentSlug || b.id === currentSlug);

      if (foundBldg) {
        setBuilding(foundBldg);
        const [bldgFloors, bldgRooms] = await Promise.all([
          apiService.getFloors(foundBldg.id),
          apiService.getRooms({ buildingId: foundBldg.id })
        ]);

        setFloors(bldgFloors);
        setRooms(bldgRooms);

        // Check query param for floor
        const queryFloorId = searchParams.get('floor');
        const targetFloor = queryFloorId
          ? bldgFloors.find(f => f.id === queryFloorId)
          : bldgFloors[0];

        setSelectedFloor(targetFloor || bldgFloors[0] || null);

        // Check query param for room
        const queryRoomId = searchParams.get('room');
        if (queryRoomId) {
          const foundRoom = bldgRooms.find(r => r.id === queryRoomId);
          if (foundRoom) {
            setSelectedRoom(foundRoom);
            const roomFloor = bldgFloors.find(f => f.id === foundRoom.floorId);
            if (roomFloor) setSelectedFloor(roomFloor);
          }
        }
      } else {
        setBuilding(undefined);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend API for campus block details.');
    } finally {
      setIsLoading(false);
    }
  }, [slug, searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <h2 className="text-lg font-bold text-slate-800">Connecting to Backend API...</h2>
        <p className="text-xs text-slate-500 font-mono">GET /api/buildings, /api/floors, /api/rooms</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <h2 className="text-lg font-bold">Backend API Connection Error</h2>
          </div>
          <p className="text-sm text-red-700">
            Could not fetch building layout from the production backend at{' '}
            <code className="font-mono bg-red-100 px-2 py-0.5 rounded text-xs">
              https://campuspulse-backend-trww.onrender.com
            </code>
          </p>
          <div className="bg-white/80 p-3 rounded-lg border border-red-200 font-mono text-xs text-red-900 break-all">
            {error}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => loadData()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Request
            </button>
            <Link
              to="/campus"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Campus Explorer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Building2 className="w-12 h-12 mx-auto text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800">Campus Block Not Found</h2>
        <p className="text-sm text-slate-500">The requested building identifier does not exist on the backend.</p>
        <Link to="/campus" className="inline-flex items-center gap-2 text-sm text-blue-600 font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Campus Explorer
        </Link>
      </div>
    );
  }

  // Calculate building-wide statistics
  const bldgRooms = rooms.filter(r => r.buildingId === building.id);
  const classrooms = bldgRooms.filter(r => r.type === 'classroom' || r.type === 'seminar_hall');
  const labs = bldgRooms.filter(r => r.type === 'laboratory');

  let occupiedCount = 0;
  bldgRooms.forEach(r => {
    const status = timetableService.getRoomStatus(r.id, simulatedDay as any, simulatedTime);
    if (status.status === 'occupied') occupiedCount++;
  });

  // Rooms for the currently selected floor
  const floorRooms = selectedFloor
    ? rooms.filter(r => r.floorId === selectedFloor.id)
    : [];

  const handleFloorChange = (floor: Floor) => {
    setSelectedFloor(floor);
    setSearchParams({ floor: floor.id });
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link to="/campus" className="hover:text-blue-600">Campus Explorer</Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">{building.name} ({building.originalCode})</span>
      </nav>

      {/* Building Hero Banner with Photo */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Building Photograph */}
        <div className="relative lg:col-span-5 h-64 lg:h-auto min-h-[280px] bg-slate-100 overflow-hidden">
          <img
            src={building.imageUrl}
            alt={building.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 font-mono font-bold text-xs bg-white text-slate-900 rounded-lg shadow-sm border border-slate-200">
              {building.originalCode}
            </span>
          </div>
          {building.slug === 'nagarjuna-block' && (
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[11px] font-medium border border-white/20">
              Iconic Brown Vertical Exterior Pillars & Courtyard
            </div>
          )}
        </div>

        {/* Right: Building Overview & Real-Time Stats */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
              <Building2 className="w-4 h-4" />
              <span>Campus Academic Block</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A]">
              {building.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {building.description}
            </p>
          </div>

          {/* Real-time stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Floors</span>
              <p className="text-lg font-black text-slate-900">{building.totalFloors} Floors</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Classrooms</span>
              <p className="text-lg font-black text-slate-900">{classrooms.length} Halls</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Laboratories</span>
              <p className="text-lg font-black text-teal-700">{labs.length} Labs</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Current Occupancy</span>
              <p className="text-lg font-black text-red-600">
                {occupiedCount} <span className="text-xs font-normal text-slate-500">/ {bldgRooms.length}</span>
              </p>
            </div>
          </div>

          {/* Time & Day Simulator Controls */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Simulate Day & Time:</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={simulatedDay}
                onChange={e => setSimulatedDay(e.target.value)}
                className="bg-white border border-blue-200 rounded-lg px-2.5 py-1 font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <input
                type="time"
                value={simulatedTime}
                onChange={e => setSimulatedTime(e.target.value)}
                className="bg-white border border-blue-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FLOOR SELECTION TABS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-lg font-bold text-[#142B4A]">
              Select Floor Level
            </h3>
            <p className="text-xs text-slate-500">
              Each floor maintains its custom architectural layout and configured rooms.
            </p>
          </div>
        </div>

        {/* Floor Cards / Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {floors.map(flr => {
            const isSelected = selectedFloor?.id === flr.id;
            const isGround = flr.floorNumber === 0;

            return (
              <button
                key={flr.id}
                onClick={() => handleFloorChange(flr)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${isSelected
                    ? 'bg-[#142B4A] text-white border-[#142B4A] shadow-md ring-2 ring-blue-500/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                    Level {flr.floorNumber}
                  </span>
                  {isGround && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      Entrance
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm mt-1">{flr.name}</h4>
                <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {flr.roomIds?.length || 0} Registered Rooms
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE 2D FLOOR BLUEPRINT */}
      {selectedFloor && (
        <section className="space-y-4">
          <FloorBlueprint
            building={building}
            floor={selectedFloor}
            rooms={floorRooms}
            selectedRoomId={selectedRoom?.id}
            selectedDay={simulatedDay}
            selectedTime={simulatedTime}
            onSelectRoom={handleSelectRoom}
          />
        </section>
      )}

      {/* FLOOR RESOURCE TABLE */}
      {selectedFloor && (
        <section className="space-y-4">
          <FloorResourceTable
            building={building}
            floor={selectedFloor}
            rooms={floorRooms}
            selectedRoomId={selectedRoom?.id}
            selectedDay={simulatedDay}
            selectedTime={simulatedTime}
            onSelectRoom={handleSelectRoom}
          />
        </section>
      )}

      {/* ROOM DETAIL MODAL */}
      <RoomDetailModal
        room={selectedRoom}
        building={building}
        floor={selectedFloor}
        selectedDay={simulatedDay}
        selectedTime={simulatedTime}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  );
};
