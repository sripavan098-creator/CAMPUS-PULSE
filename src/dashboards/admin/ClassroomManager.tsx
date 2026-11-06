import React, { useState } from 'react';
import { Plus, Trash2, Edit, Search, X } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useApiResource } from '../../hooks/useApiResource';
import { Room, Building, Floor, Department, RoomType } from '../../types';

export const ClassroomManager: React.FC = () => {
  const { data: rooms, loading, error, reload } = useApiResource<Room[]>(
    () => apiService.getRooms(),
    []
  );
  const { data: buildings } = useApiResource<Building[]>(() => apiService.getBuildings(), []);
  const { data: floors } = useApiResource<Floor[]>(() => apiService.getFloors(), []);
  const { data: departments } = useApiResource<Department[]>(() => apiService.getDepartments(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBldgFilter, setSelectedBldgFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [roomNumber, setRoomNumber] = useState('');
  const [roomName, setRoomName] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('classroom');
  const [departmentId, setDepartmentId] = useState('');
  const [capacity, setCapacity] = useState(70);

  const filteredFloors = floors.filter(f => f.buildingId === buildingId);

  const openCreateModal = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setRoomName('');
    const defaultBldg = buildings[0]?.id || '';
    setBuildingId(defaultBldg);
    setFloorId(floors.find(f => f.buildingId === defaultBldg)?.id || '');
    setRoomType('classroom');
    setDepartmentId(departments[0]?.id || '');
    setCapacity(70);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Room) => {
    setEditingRoom(r);
    setRoomNumber(r.roomNumber);
    setRoomName(r.name);
    setBuildingId(r.buildingId);
    setFloorId(r.floorId);
    setRoomType(r.type);
    setDepartmentId(r.departmentId || '');
    setCapacity(r.capacity);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this room? It will be removed from blueprints, floor lists, and availability searches.')) return;
    setBusy(true);
    try {
      await apiService.deleteRoom(id);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete room');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (editingRoom) {
        await apiService.updateRoom(editingRoom.id, {
          blockId: buildingId,
          floorId,
          type: roomType,
          capacity: Number(capacity)
        });
      } else {
        await apiService.createRoom({
          id: roomNumber,
          blockId: buildingId,
          floorId,
          type: roomType,
          capacity: Number(capacity)
        });
      }
      setIsModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save room');
    } finally {
      setBusy(false);
    }
  };

  const displayedRooms = rooms.filter(r => {
    if (selectedBldgFilter && r.buildingId !== selectedBldgFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.roomNumber.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142B4A]">Campus Classroom Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add and manage classrooms. Rooms automatically synchronize to 2D floor blueprints, search, and availability.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading rooms…</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Could not load rooms: {error}
        </p>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600">Building:</label>
          <select
            value={selectedBldgFilter}
            onChange={e => setSelectedBldgFilter(e.target.value)}
            className="p-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
          >
            <option value="">All Buildings ({rooms.length} Rooms)</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.originalCode})</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search room (e.g. N-204)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Room No.</th>
                <th className="py-3 px-4">Room Name</th>
                <th className="py-3 px-4">Building</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching classrooms found.
                  </td>
                </tr>
              ) : (
                displayedRooms.map(r => {
                  const bldg = buildings.find(b => b.id === r.buildingId);
                  const flr = floors.find(f => f.id === r.floorId);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 bg-slate-50/50">
                        {r.roomNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{r.name}</td>
                      <td className="py-3 px-4 text-slate-700">{bldg?.name} ({bldg?.originalCode})</td>
                      <td className="py-3 px-4 text-slate-600">{flr?.name}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-slate-700">{r.type}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{r.capacity} seats</td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                          title="Edit Room"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="Delete Room"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-[#142B4A] text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingRoom ? 'Edit Room Configuration' : 'Register New Campus Room'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Room Number (e.g. N-204)</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    required
                    disabled={!!editingRoom}
                    placeholder="e.g. N-204"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={e => setCapacity(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Room Name / Label</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. Smart Interactive Lecture Hall N-204"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Building</label>
                  <select
                    value={buildingId}
                    onChange={e => {
                      setBuildingId(e.target.value);
                      const bflrs = floors.filter(f => f.buildingId === e.target.value);
                      setFloorId(bflrs[0]?.id || '');
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.originalCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Floor</label>
                  <select
                    value={floorId}
                    onChange={e => setFloorId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {filteredFloors.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Room Type</label>
                  <select
                    value={roomType}
                    onChange={e => setRoomType(e.target.value as RoomType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="classroom">Classroom</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="seminar_hall">Seminar Hall</option>
                    <option value="facility">Facility / Office</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Host Department</label>
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
