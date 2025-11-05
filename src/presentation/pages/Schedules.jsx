import { useEffect, useMemo, useState } from 'react';
// ✅ Clean Architecture: Sử dụng Custom Hooks
import { useSchedules } from '../hooks/useSchedules';
import { useProjects } from '../hooks/useProjects';
import { useLocations } from '../hooks/useLocations';
// ❌ TODO: listUsers vẫn import trực tiếp
import { listUsers } from '../../infrastructure/repositories/usersRepository';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/common/Toaster';
import { confirm } from '../components/common/ConfirmDialog';
import { Plus, Pencil, Trash2, Search, Calendar, Clock, MapPin, Users, BarChart3, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Pagination } from 'antd';

const defaultForm = { 
  locationId: '', 
  locationName: '', 
  projectId: '', 
  startAt: '', 
  endAt: '', 
  members: [], 
  notes: '', 
  active: true 
};

export default function Schedules() {
  const { currentUser, accessibleProjects, userProfile } = useAuth();
  
  // ✅ Clean Architecture: Sử dụng Custom Hooks
  const {
    schedules: items,  // Rename để giữ tương thích với code cũ
    loading: schedulesLoading,
    createSchedule: createScheduleHook,
    updateSchedule: updateScheduleHook,
    deleteSchedule: deleteScheduleHook,
    refresh: refreshSchedules
  } = useSchedules({ accessibleProjectIds: accessibleProjects });

  const {
    projects,
    loading: projectsLoading
  } = useProjects({ accessibleProjectIds: accessibleProjects });

  const {
    locations,
    loading: locationsLoading
  } = useLocations({ accessibleProjectIds: accessibleProjects });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(i => 
      (i.keywords || []).some(k => k.includes(s)) || 
      (i.notes || '').toLowerCase().includes(s) ||
      (i.locationName || '').toLowerCase().includes(s)
    );
  }, [items, search]);

  // Stats
  const totalSchedules = items.length;
  const todaySchedules = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return (items || []).filter(it => {
      const d = it.startAt?.toDate ? it.startAt.toDate() : (it.startAt?.seconds ? new Date(it.startAt.seconds * 1000) : null);
      if (!d) return false; d.setHours(0,0,0,0); return d.getTime() === today.getTime();
    }).length;
  }, [items]);
  const upcoming7Days = useMemo(() => {
    const now = new Date();
    const next7 = new Date(); next7.setDate(now.getDate() + 7);
    return (items || []).filter(it => {
      const d = it.startAt?.toDate ? it.startAt.toDate() : (it.startAt?.seconds ? new Date(it.startAt.seconds * 1000) : null);
      return d && d >= now && d <= next7;
    }).length;
  }, [items]);
  const activeCount = useMemo(() => (items || []).filter(i => i.active).length, [items]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const load = async () => {
    setLoading(true);
    // ✅ Schedules, Projects, và Locations được load tự động bởi hooks
    // Chỉ cần load users
    const userList = await listUsers({});  // Always load ALL users for schedules to display member names
    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => { load(); }, [accessibleProjects, items, projects, locations]); // ✅ Reload khi data thay đổi

  // ✅ Clean Architecture: Sử dụng hook methods
  const submit = async (e) => {
    e.preventDefault();
    if (!form.locationId || !form.projectId || !form.startAt || !form.endAt) return;
    
    try {
      const isUpdating = !!editing;
      if (isUpdating) {
        await updateScheduleHook(editing.id, form, currentUser);
      } else {
        await createScheduleHook(form, currentUser);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      await load(); // Reload users
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in submit:', error);
    }
  };

  const onEdit = (item) => {
    setEditing(item);
    
    // Helper function to convert timestamp to datetime-local format
    const formatForInput = (timestamp) => {
      if (!timestamp) return '';
      
      let date;
      if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) return '';
      
      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setForm({ 
      locationId: item.locationId || '', 
      locationName: item.locationName || '', 
      projectId: item.projectId || '', 
      startAt: formatForInput(item.startAt),
      endAt: formatForInput(item.endAt),
      members: item.members || [], 
      notes: item.notes || '', 
      active: item.active !== undefined ? item.active : true
    });
    setShowForm(true);
  };

  // ✅ Clean Architecture: Sử dụng hook method
  const onDelete = async (id) => {
    try {
      await deleteScheduleHook(id);
      await load(); // Reload users
      // ✅ Confirm và toast đã được handle trong hook
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in onDelete:', error);
    }
  };

  const handleLocationChange = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    setForm({
      ...form,
      locationId,
      locationName: location ? location.name : ''
    });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    
    // Handle different timestamp formats
    let date;
    if (timestamp.seconds) {
      // Firestore Timestamp
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      // Firestore Timestamp with toDate method
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      // ISO string
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      // Unix timestamp
      date = new Date(timestamp);
    } else {
      return '-';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (active) => {
    return active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch làm việc</h1>
          <p className="text-gray-600">Quản lý kế hoạch làm việc theo dự án</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Tổng lịch</p>
              <p className="text-xl font-semibold">{totalSchedules}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Hôm nay</p>
              <p className="text-xl font-semibold">{todaySchedules}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">7 ngày tới</p>
              <p className="text-xl font-semibold">{upcoming7Days}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Đang hoạt động</p>
              <p className="text-xl font-semibold">{activeCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Danh sách lịch làm việc</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Tìm kiếm theo ghi chú, địa điểm..." 
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                />
              </div>
              <button 
                onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm); }} 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm lịch làm việc</span>
              </button>
            </div>
          </div>

          {(loading || schedulesLoading || projectsLoading || locationsLoading) ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Địa điểm</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dự án</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian bắt đầu</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian kết thúc</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thành viên</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="w-24 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{item.locationName || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {projects.find(p => p.id === item.projectId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm">{formatDateTime(item.startAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm">{formatDateTime(item.endAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedMembers(item.members || []);
                            setShowMembersModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.members?.length || 0} người</span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.active)}`}>
                          {item.active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button 
                            onClick={() => onEdit(item)} 
                            className="p-2 hover:bg-gray-100 rounded"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onDelete(item.id)} 
                            className="p-2 hover:bg-gray-100 rounded text-red-600"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-center text-gray-500" colSpan="7">
                        Không có lịch làm việc nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            current={currentPage}
            total={filtered.length}
            pageSize={itemsPerPage}
            showSizeChanger={false}
            showQuickJumper={false}
            showTotal={false}
            onChange={(page) => setCurrentPage(page)}
            className="ant-pagination-custom"
          />
        </div>
      )}

      {/* Form tạo/sửa schedule */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setEditing(null);
              setForm(defaultForm);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              {editing ? 'Cập nhật lịch làm việc' : 'Thêm lịch làm việc'}
            </h3>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dự án *</label>
                  <select 
                    value={form.projectId} 
                    onChange={(e)=>setForm({...form, projectId: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Địa điểm *</label>
                  <select 
                    value={form.locationId} 
                    onChange={(e) => handleLocationChange(e.target.value)} 
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">-- Chọn địa điểm --</option>
                    {locations.filter(l => l.status === 'confirm').map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Thời gian bắt đầu *</label>
                  <input 
                    type="datetime-local"
                    value={form.startAt} 
                    onChange={(e)=>setForm({...form, startAt: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Thời gian kết thúc *</label>
                  <input 
                    type="datetime-local"
                    value={form.endAt} 
                    onChange={(e)=>setForm({...form, endAt: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Thành viên</label>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.members.map(userId => {
                      const user = users.find(u => u.id === userId);
                      return (
                        <div key={userId} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          <span>{user?.displayName || user?.email || userId}</span>
                          <button
                            type="button"
                            onClick={() => setForm({...form, members: form.members.filter(id => id !== userId)})}
                            className="hover:bg-blue-200 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                    {form.members.length === 0 && (
                      <span className="text-sm text-gray-500">Chưa có thành viên nào</span>
                    )}
                  </div>
                  <select 
                    value=""
                    onChange={(e) => {
                      const userId = e.target.value;
                      if (userId && !form.members.includes(userId)) {
                        setForm({...form, members: [...form.members, userId]});
                      }
                    }}
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">-- Thêm thành viên --</option>
                    {users.filter(u => !form.members.includes(u.id)).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.displayName || u.email} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ghi chú</label>
                <textarea 
                  value={form.notes} 
                  onChange={(e)=>setForm({...form, notes: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  rows={3}
                  placeholder="Nhập ghi chú về lịch làm việc..."
                />
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={form.active} 
                  onChange={(e)=>setForm({...form, active: e.target.checked})} 
                  className="mr-2"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Lịch làm việc đang hoạt động
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={()=>{setShowForm(false); setEditing(null); setForm(defaultForm);}} 
                  className="px-3 py-2 rounded border hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {editing ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal hiển thị danh sách thành viên */}
      {showMembersModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMembersModal(false);
              setSelectedMembers([]);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Danh sách thành viên ({selectedMembers.length})
              </h3>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedMembers([]);
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {selectedMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có thành viên nào
              </div>
            ) : (
              <div className="space-y-2">
                {selectedMembers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return (
                    <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{user?.displayName || user?.email || userId}</div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {user?.role || 'staff'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedMembers([]);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
