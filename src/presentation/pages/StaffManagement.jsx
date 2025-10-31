import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Camera, 
  BookOpen, 
  Play, 
  CheckCircle, 
  XCircle,
  Upload,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Key
} from 'lucide-react';
import { listUsers, createUser, updateUser, deleteUser, assignUserToProjects, fixSpecificUserMobileIssue } from '../../infrastructure/repositories/usersRepository';
import { listProjects } from '../../infrastructure/repositories/projectsRepository';
import { listOrgs } from '../../infrastructure/repositories/orgsRepository';
import { listAcls } from '../../infrastructure/repositories/aclsRepository';
import { useAuth } from '../contexts/AuthContext';

const mockTrainingModules = [
  {
    id: 1,
    title: 'Quy trình bán hàng cơ bản',
    duration: '2 giờ',
    status: 'completed',
    score: 88,
  },
  {
    id: 2,
    title: 'Kỹ năng giao tiếp khách hàng',
    duration: '1.5 giờ',
    status: 'in-progress',
    score: null,
  },
  {
    id: 3,
    title: 'Xử lý tình huống khó khăn',
    duration: '1 giờ',
    status: 'pending',
    score: null,
  },
];

export default function StaffManagement() {
  const { currentUser, accessibleProjects, isRoot, hasAccessToAllProjects } = useAuth();
  const [staff, setStaff] = useState([]);
  const [projects, setProjects] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAssignProject, setShowAssignProject] = useState(false);
  const [fixEmail, setFixEmail] = useState('');
  const [search, setSearch] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [form, setForm] = useState({ displayName: '', email: '', phoneNumber: '', role: 'admin', password: '', lastOrgId: '', projectIds: [] });

  useEffect(() => {
    loadData();
  }, [accessibleProjects, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffList, projectsList, aclRules, orgList] = await Promise.all([
        listUsers({ search, accessibleProjectIds: accessibleProjects }),
        listProjects({ accessibleProjectIds: accessibleProjects }),
        listAcls(),
        listOrgs()
      ]);
      setStaff(staffList);
      setProjects(projectsList);
      setOrgs(orgList);
      // Derive unique roles from ACLs, scoped by accessibleProjects
      const filterByAccess = (arr) => {
        if (accessibleProjects === '*') return arr || [];
        const setIds = new Set(accessibleProjects || []);
        return (arr || []).filter(r => !r.projectId || setIds.has(r.projectId));
      };
      const scopedAcls = filterByAccess(aclRules);
      const roleSet = new Set(scopedAcls.map(r => r.role).filter(Boolean));
      // remove 'staff' from UI
      roleSet.delete('staff');
      const derivedRoles = Array.from(roleSet);
      const finalRoles = derivedRoles.length ? derivedRoles : ['admin'];
      setRoles(finalRoles);
      // ensure current form role is valid
      if (!finalRoles.includes(form.role)) {
        setForm((prev) => ({ ...prev, role: finalRoles[0] }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      if (!form.lastOrgId) {
        alert('Vui lòng chọn Tổ chức');
        return;
      }
      const created = await createUser({
        ...form,
        lastOrgId: form.lastOrgId,
        projectIds: form.projectIds,
      }, currentUser);
      if (form.projectIds?.length) {
        await assignUserToProjects(created.id, form.projectIds);
      }
      setShowAddStaff(false);
      setForm({ displayName: '', email: '', phoneNumber: '', role: roles[0] || 'admin', password: '', lastOrgId: '', projectIds: [] });
      await loadData();
    } catch (error) {
      alert('Lỗi tạo nhân viên: ' + error.message);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!confirm('Xóa nhân viên này?')) return;
    try {
      await deleteUser(id);
      await loadData();
    } catch (error) {
      alert('Lỗi xóa nhân viên: ' + error.message);
    }
  };

  const handleAssignProject = async (projectIds) => {
    try {
      // Validate within accessibleProjects for non-root
      const canAccessAll = accessibleProjects === '*' || (await isRoot());
      if (!canAccessAll) {
        const allowed = new Set(accessibleProjects || []);
        const invalid = (projectIds || []).filter(id => !allowed.has(id));
        if (invalid.length) {
          alert('Bạn chỉ có thể gán dự án trong phạm vi được cấp quyền.');
          return;
        }
      }

      await assignUserToProjects(selectedStaff.id, projectIds);
      setShowAssignProject(false);
      setSelectedStaff(null);
      await loadData();
    } catch (error) {
      alert('Lỗi gán dự án: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'registered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in-progress': return 'Đang thực hiện';
      case 'pending': return 'Chờ thực hiện';
      case 'registered': return 'Đã đăng ký';
      default: return 'Chưa xác định';
    }
  };

  const filteredStaff = (staff || [])
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (s.displayName || '').toLowerCase().includes(q) ||
             (s.email || '').toLowerCase().includes(q) ||
             (s.phoneNumber || '').includes(search);
    })
    .filter(s => {
      if (!filterProjectId) return true;
      return Array.isArray(s.projectIds) && s.projectIds.includes(filterProjectId);
    })
    .filter(s => {
      if (!filterRole) return true;
      return (s.role || '') === filterRole;
    })
    .filter(s => {
      if (!filterEmail) return true;
      return (s.email || '').toLowerCase().includes(filterEmail.toLowerCase());
    });

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân sự</h1>
          <p className="text-gray-600">Quản lý thông tin nhân viên, training và Face ID</p>
        </div>
        {/* Quick admin tools */}
        <div className="hidden md:flex items-center gap-2">
          <input
            value={fixEmail}
            onChange={(e)=>setFixEmail(e.target.value)}
            placeholder="Nhập email để sửa memberships"
            className="px-3 py-2 border rounded-md text-sm"
          />
          <button
            onClick={async ()=>{
              if (!fixEmail) return alert('Nhập email');
              try {
                const res = await fixSpecificUserMobileIssue(fixEmail);
                alert(res?.success ? 'Đã sửa memberships cho '+fixEmail : 'Không sửa được: '+(res?.error||''));
              } catch (err) {
                alert('Lỗi: '+(err?.message||err));
              }
            }}
            className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
          >
            Sửa Org/Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng nhân viên
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {staff.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Camera className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Face ID đã đăng ký
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {staff.filter(s => s.enable).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đã được gán dự án
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {staff.filter(s => s.projectIds && s.projectIds.length > 0).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Play className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang hoạt động
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {staff.filter(s => s.enable !== false).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Danh sách nhân viên
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'training'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Chương trình training
            </button>
            <button
              onClick={() => setActiveTab('faceid')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'faceid'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quản lý Face ID
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Danh sách nhân viên</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm nhân viên..."
                    className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  />
                  <select
                    value={filterProjectId}
                    onChange={(e) => setFilterProjectId(e.target.value)}
                    className="block w-56 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  >
                    <option value="">Tất cả dự án</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="block w-44 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  >
                    <option value="">Tất cả vai trò</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={filterEmail}
                    onChange={(e) => setFilterEmail(e.target.value)}
                    placeholder="Lọc theo email"
                    className="block w-56 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  />
                  <button
                    onClick={() => setShowAddStaff(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Thêm nhân viên</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vai trò
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dự án
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          Đang tải...
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          Không có nhân viên nào
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {s.displayName || s.email || 'Chưa có tên'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.email || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.phoneNumber || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {s.role || 'staff'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.projectIds?.length || 0} dự án
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.enable !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {s.enable !== false ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {setSelectedStaff(s); setShowAssignProject(true);}}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteStaff(s.id)}
                                className="p-2 hover:bg-gray-100 rounded text-red-600"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'training' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Chương trình training</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Thêm module mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockTrainingModules.map((module) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">{module.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(module.status)}`}>
                        {getStatusText(module.status)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">Thời lượng: {module.duration}</p>
                    
                    {module.score && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Điểm số:</span>
                          <span className="font-medium">{module.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${module.score}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
                        Xem chi tiết
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faceid' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Quản lý Face ID</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Đăng ký Face ID mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {staff.length === 0 ? (
                  <div className="col-span-2 text-center text-gray-500">
                    Chưa có nhân viên nào
                  </div>
                ) : (
                  staff.map((staffMember) => (
                    <div key={staffMember.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{staffMember.displayName || 'Chưa có tên'}</h4>
                          <p className="text-sm text-gray-600">{staffMember.email}</p>
                          <p className="text-sm text-gray-500">{staffMember.phoneNumber || '-'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${staffMember.enable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {staffMember.enable ? 'Đã đăng ký' : 'Chưa đăng ký'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        {staffMember.enable ? (
                          <>
                            <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors">
                              Cập nhật Face ID
                            </button>
                            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
                            Đăng ký Face ID
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roleplay Upload Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Upload Roleplay Video
          </h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="roleplay-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Kéo thả file video hoặc click để chọn
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  Hỗ trợ MP4, AVI, MOV (tối đa 100MB)
                </span>
              </label>
              <input
                id="roleplay-upload"
                type="file"
                accept="video/*"
                className="sr-only"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <strong>Lưu ý:</strong> Nhân viên cần upload video roleplay mỗi ngày hoặc 3 ngày 1 lần tùy theo quy định.
            </p>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Thêm nhân viên mới</h3>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu (mặc định: 123456)
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Để trống nếu dùng mật khẩu mặc định"
                />
              </div>
              {/* Org select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổ chức</label>
                <select
                  required
                  value={form.lastOrgId}
                  onChange={(e) => setForm({ ...form, lastOrgId: e.target.value, projectIds: [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn tổ chức</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              {/* Projects multi-select filtered by org */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {projects
                    .filter(p => !form.lastOrgId || p.orgId === form.lastOrgId)
                    .map((p) => {
                      const checked = form.projectIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...form.projectIds, p.id]
                                : form.projectIds.filter(id => id !== p.id);
                              setForm({ ...form, projectIds: next });
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm">{p.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Tạo nhân viên
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStaff(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Project Modal */}
      {showAssignProject && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Gán dự án cho: {selectedStaff.displayName || selectedStaff.email}</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {projects.map((project) => (
                <label key={project.id} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    defaultChecked={selectedStaff.projectIds?.includes(project.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">{project.name}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => {
                  const selected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                    .map(cb => cb.parentElement.querySelector('span').textContent);
                  const projectIds = projects
                    .filter(p => selected.includes(p.name))
                    .map(p => p.id);
                  handleAssignProject(projectIds);
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Lưu
              </button>
              <button
                onClick={() => {
                  setShowAssignProject(false);
                  setSelectedStaff(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
