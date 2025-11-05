import { useEffect, useMemo, useState } from 'react';
// ✅ Clean Architecture: Sử dụng Custom Hooks thay vì gọi trực tiếp Infrastructure
import { useProjects } from '../hooks/useProjects';
import { useOrgs } from '../hooks/useOrgs';
import { useMembers } from '../hooks/useMembers';
import { useProjectsLocations } from '../hooks/useProjectsLocations';
// ❌ TODO: listUsers và listLocations - có thể refactor sau nếu cần
import { listUsers } from '../../infrastructure/repositories/usersRepository';
import { listLocations } from '../../infrastructure/repositories/locationsRepository';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/common/Toaster';
import { confirm } from '../components/common/ConfirmDialog';
import { Plus, Pencil, Trash2, Search, Building, BarChart3, Package, Calendar, Users, UserPlus, Image as ImageIcon, Upload, MapPinned, MapPin, X } from 'lucide-react';
import { Pagination } from 'antd';

const defaultProjectForm = { name: '', description: '', orgId: '', tags: [] };

export default function Projects() {
  const { currentUser, accessibleProjects, isRoot, userProfile } = useAuth();
  const [isRootFlag, setIsRootFlag] = useState(false);
  
  // ✅ Clean Architecture: Sử dụng Custom Hooks
  const {
    projects: items,  // Rename để giữ tương thích với code cũ
    loading: projectsLoading,
    createProject: createProjectHook,
    updateProject: updateProjectHook,
    deleteProject: deleteProjectHook,
    refresh: refreshProjects
  } = useProjects({ accessibleProjectIds: accessibleProjects });

  const {
    orgs,
    loading: orgsLoading,
    createOrg: createOrgHook,
    updateOrg: updateOrgHook,
    deleteOrg: deleteOrgHook,
    uploadOrgPhoto: uploadOrgPhotoHook,
    refresh: refreshOrgs
  } = useOrgs();

  const {
    getProjectMembers,
    getOrgMembers,
    addUserToProject,
    addUserToOrg,
    removeUserFromProject,
    removeUserFromOrg,
    getUsersByIds,
    getUserOrgs,
    getUserProjects
  } = useMembers();

  const {
    getLocationsByProject,
    createProjectLocation,
    deleteProjectLocation
  } = useProjectsLocations();
  
  // Data states
  const [locations, setLocations] = useState([]);
  const [projectMembers, setProjectMembers] = useState({});
  const [orgMembers, setOrgMembers] = useState({});
  const [projectLocations, setProjectLocations] = useState({}); // {projectId: [locationId1, locationId2]}
  const [allUsers, setAllUsers] = useState([]);
  const [userOrgIds, setUserOrgIds] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('orgs');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  
  // Assignment states for project-location
  const [showAssignLocationModal, setShowAssignLocationModal] = useState(false);
  const [selectedProjectForLocation, setSelectedProjectForLocation] = useState(null);
  const [locationModalSearch, setLocationModalSearch] = useState('');
  const [locationModalProvince, setLocationModalProvince] = useState('');
  const [locationModalDistrict, setLocationModalDistrict] = useState('');
  
  // Project form states
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultProjectForm);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', code: '', description: '' });
  const [editingOrg, setEditingOrg] = useState(null);
  const [uploadingOrgPhoto, setUploadingOrgPhoto] = useState(false);
  const [orgPhotoFile, setOrgPhotoFile] = useState(null);
  
  // User selection states (for adding to org/project)
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedOrgForUser, setSelectedOrgForUser] = useState(null);
  const [selectedProjectForUser, setSelectedProjectForUser] = useState(null);
  const [userMemberships, setUserMemberships] = useState({}); // {userId: {orgs: [], projects: []}}
  
  // Members modal states
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedOrgMembers, setSelectedOrgMembers] = useState([]);
  const [selectedProjectMembers, setSelectedProjectMembers] = useState([]);
  const [membersModalType, setMembersModalType] = useState('org'); // 'org' or 'project'
  const [membersModalTitle, setMembersModalTitle] = useState('');

  const filteredProjects = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(i => (i.keywords || []).some(k => k.includes(s)) || (i.name || '').toLowerCase().includes(s));
  }, [items, search]);

  // Load orgs that the current user belongs to (from orgs_members)
  useEffect(() => {
    let active = true;
    async function loadUserOrgs() {
      if (!currentUser) return;
      try {
        const list = await getUserOrgs(currentUser.uid);
        const ids = (list || []).map(x => x.orgId || x.id).filter(Boolean);
        if (active) setUserOrgIds(ids);
      } catch (e) {
        console.warn('Failed to load user orgs:', e);
        if (active) setUserOrgIds([]);
      }
    }
    loadUserOrgs();
    return () => { active = false; };
  }, [currentUser, getUserOrgs]);

  // Only show orgs the current user can access:
  // - root: all
  // - others: orgs that contain projects in the user's accessible set
  const scopedOrgs = useMemo(() => {
    if (accessibleProjects === '*' || isRootFlag) return orgs;
    const projectOrgSet = new Set((items || []).map(p => p.orgId).filter(Boolean));
    const userOrgSet = new Set((userOrgIds || []));
    const allowed = new Set([...projectOrgSet, ...userOrgSet]);
    return (orgs || []).filter(o => allowed.has(o.id));
  }, [orgs, items, accessibleProjects, isRootFlag, userOrgIds]);

  const filteredOrgs = useMemo(() => {
    const base = scopedOrgs;
    if (!search) return base;
    const s = search.toLowerCase();
    return base.filter(o => (o.keywords || []).some(k => k.includes(s)) || (o.name || '').toLowerCase().includes(s));
  }, [scopedOrgs, search]);

  // Extract unique provinces and districts for location modal
  const { provinces, districts } = useMemo(() => {
    const provinceSet = new Set();
    const districtSet = new Set();
    
    locations.forEach(loc => {
      const province = loc.locationMark?.province;
      const district = loc.locationMark?.district;
      
      // Only add if it's a string
      if (province && typeof province === 'string') {
        provinceSet.add(province);
      }
      if (district && typeof district === 'string') {
        districtSet.add(district);
      }
    });
    
    return {
      provinces: Array.from(provinceSet).sort(),
      districts: Array.from(districtSet).sort()
    };
  }, [locations]);

  // Stats
  const totalProjects = items.length;
  const totalOrgs = orgs.length;
  const uniqueTags = useMemo(() => {
    const set = new Set();
    for (const p of items) (p.tags || []).forEach(t => set.add(t));
    return set.size;
  }, [items]);
  const projectsThisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${now.getMonth() + 1}`;
    return items.filter(p => {
      const d = p.createdAt?.toDate ? p.createdAt.toDate() : (p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : null);
      if (!d) return false;
      return `${d.getFullYear()}-${d.getMonth() + 1}` === ym;
    }).length;
  }, [items]);

  // Pagination logic for projects
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, itemsPerPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const load = async () => {
    setLoading(true);
    // ✅ Projects và Orgs được load tự động bởi hooks
    // Chỉ cần load các phần khác
    const [usersList, locationsList] = await Promise.all([
      listUsers({ accessibleProjectIds: accessibleProjects }),
      listLocations({}) // Load ALL locations, not filtered by accessible projects
    ]);
    setAllUsers(usersList);
    setLocations(locationsList);
    
    // Load members for each project
    const projectMembersMap = {};
    for (const project of items) {
      try {
        const members = await getProjectMembers(project.id);
        projectMembersMap[project.id] = members.length;
      } catch (error) {
        console.error(`Error loading members for project ${project.id}:`, error);
        projectMembersMap[project.id] = 0;
      }
    }
    setProjectMembers(projectMembersMap);
    
    // Load members for each org
    const orgMembersMap = {};
    for (const org of orgs) {
      try {
        const members = await getOrgMembers(org.id);
        orgMembersMap[org.id] = members.length;
      } catch (error) {
        console.error(`Error loading members for org ${org.id}:`, error);
        orgMembersMap[org.id] = 0;
      }
    }
    setOrgMembers(orgMembersMap);
    
    // Load project-location relationships
    const projectLocationsMap = {};
    for (const project of items) {
      try {
        const locs = await getLocationsByProject(project.id);
        projectLocationsMap[project.id] = locs.map(pl => pl.locationId);
      } catch (error) {
        console.error(`Error loading locations for project ${project.id}:`, error);
        projectLocationsMap[project.id] = [];
      }
    }
    setProjectLocations(projectLocationsMap);
    
    setLoading(false);
  };

  useEffect(() => { 
    (async () => { 
      setIsRootFlag(await isRoot()); 
      await load(); 
    })(); 
  }, [accessibleProjects, items, orgs]); // ✅ Reload khi projects hoặc orgs thay đổi

  // ✅ Clean Architecture: Sử dụng hook methods
  const submitProject = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    try {
      if (editing) {
        await updateProjectHook(editing.id, form, currentUser);
      } else {
        await createProjectHook(form, currentUser);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultProjectForm);
      await load(); // Reload other data
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in submitProject:', error);
    }
  };

  const onEditProject = (item) => {
    setEditing(item);
    setForm({ 
      name: item.name || '', 
      description: item.description || '', 
      orgId: item.orgId || '', 
      tags: item.tags || []
    });
    setShowForm(true);
  };

  // ✅ Clean Architecture: Sử dụng hook method
  const onDeleteProject = async (id) => {
    try {
      await deleteProjectHook(id);
      await load(); // Reload other data
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in onDeleteProject:', error);
    }
  };

  // ✅ Clean Architecture: Sử dụng hook methods
  const createNewOrg = async (e) => {
    e.preventDefault();
    if (!orgForm.name?.trim()) return;
    try {
      setUploadingOrgPhoto(true);
      let photoUrls = [];
      
      if (editingOrg) {
        // Sửa org: upload ảnh nếu có
        if (orgPhotoFile) {
          const photoUrl = await uploadOrgPhotoHook(editingOrg.id, orgPhotoFile);
          photoUrls = [photoUrl];
        }
        await updateOrgHook(editingOrg.id, { ...orgForm, photoUrls: photoUrls.length > 0 ? photoUrls : orgForm.photoUrls }, currentUser);
      } else {
        // Tạo org mới: tạo document trước, rồi upload ảnh
        const newOrg = await createOrgHook(orgForm, currentUser);
        if (orgPhotoFile) {
          const photoUrl = await uploadOrgPhotoHook(newOrg.id, orgPhotoFile);
          photoUrls = [photoUrl];
          await updateOrgHook(newOrg.id, { photoUrls }, currentUser);
        }
      }
      
      setShowOrgForm(false);
      setOrgForm({ name: '', code: '', description: '' });
      setEditingOrg(null);
      setOrgPhotoFile(null);
      await load(); // Reload other data
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in createNewOrg:', error);
    } finally {
      setUploadingOrgPhoto(false);
    }
  };

  const onEditOrg = (org) => {
    setEditingOrg(org);
    setOrgForm({ name: org.name || '', code: org.code || '', description: org.description || '', photoUrls: org.photoUrls || [] });
    setOrgPhotoFile(null);
    setShowOrgForm(true);
  };

  // ✅ Clean Architecture: Sử dụng hook method
  const onDeleteOrg = async (id) => {
    try {
      await deleteOrgHook(id);
      await load(); // Reload other data
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in onDeleteOrg:', error);
    }
  };

  // Load user memberships from orgs_members and projects_members
  const loadUserMemberships = async () => {
    const memberships = {};
    for (const user of allUsers) {
      const userOrgsData = await getUserOrgs(user.id);
      const userProjectsData = await getUserProjects(user.id);
      memberships[user.id] = {
        orgs: userOrgsData.map(m => m.orgId),
        projects: userProjectsData.map(m => m.projectId)
      };
    }
    setUserMemberships(memberships);
  };

  // Load memberships when opening add user modal
  useEffect(() => {
    if (showAddUserModal) {
      loadUserMemberships();
    }
  }, [showAddUserModal]);

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổ chức & Dự án</h1>
          <p className="text-gray-600">Quản lý tổ chức, dự án và nhân sự</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Building className="w-5 h-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Tổng tổ chức</p>
              <p className="text-xl font-semibold">{totalOrgs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Tổng dự án</p>
              <p className="text-xl font-semibold">{totalProjects}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Tổng nhân viên</p>
              <p className="text-xl font-semibold">{allUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('orgs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orgs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tổ chức
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dự án
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Phân công địa điểm
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Orgs */}
          {activeTab === 'orgs' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Danh sách tổ chức</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                      placeholder="Tìm kiếm..." 
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                    />
                  </div>
                  {isRootFlag && (
                    <button onClick={() => setShowOrgForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Thêm tổ chức</span>
                    </button>
                  )}
                </div>
              </div>

              {(loading || projectsLoading || orgsLoading) ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tên tổ chức</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thành viên</th>
                        <th className="w-24 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrgs.map((org) => (
                        <tr key={org.id} className="border-t hover:bg-gray-50">
                          <td className="px-6 py-4">
                            {org.photoUrls && org.photoUrls.length > 0 ? (
                              <img src={org.photoUrls[0]} alt={org.name} className="w-16 h-16 object-cover rounded-lg" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium">{org.name}</td>
                          <td className="px-6 py-4 text-gray-600">{org.description}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={async () => {
                                const members = await getOrgMembers(org.id);
                                const userIds = members.map(m => m.userId);
                                const users = await getUsersByIds(userIds);
                                const membersWithUsers = members.map(m => ({
                                  ...m,
                                  user: users.find(u => u.id === m.userId)
                                }));
                                setSelectedOrgMembers(membersWithUsers);
                                setMembersModalType('org');
                                setMembersModalTitle(`Thành viên của ${org.name}`);
                                setShowMembersModal(true);
                              }}
                              className="inline-flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <Users className="w-4 h-4" />
                              <span className="font-medium">{orgMembers[org.id] || 0}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => {setSelectedOrgForUser(org); setShowAddUserModal(true);}} className="p-2 hover:bg-gray-100 rounded" title="Thêm nhân sự">
                                <UserPlus className="w-4 h-4 text-blue-600" />
                              </button>
                              {isRootFlag && (
                                <>
                                  <button onClick={() => onEditOrg(org)} className="p-2 hover:bg-gray-100 rounded" title="Sửa">
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => onDeleteOrg(org.id)} className="p-2 hover:bg-gray-100 rounded text-red-600" title="Xóa">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {orgs.length === 0 && (
                        <tr>
                          <td className="px-6 py-6 text-center text-gray-500" colSpan="5">Không có dữ liệu</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Tab: Projects */}
          {activeTab === 'projects' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Danh sách dự án</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                      placeholder="Tìm kiếm..." 
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                    />
                  </div>
                  {isRootFlag && (
                    <button onClick={() => { setShowForm(true); setEditing(null); setForm(defaultProjectForm); }} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Thêm dự án</span>
                    </button>
                  )}
                </div>
              </div>

          {(loading || projectsLoading) ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tên dự án</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Công ty</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thành viên</th>
                    <th className="w-24 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-gray-600">{item.description}</td>
                      <td className="px-6 py-4">{orgs.find(o => o.id === item.orgId)?.name || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={async () => {
                            const members = await getProjectMembers(item.id);
                            const userIds = members.map(m => m.userId);
                            const users = await getUsersByIds(userIds);
                            const membersWithUsers = members.map(m => ({
                              ...m,
                              user: users.find(u => u.id === m.userId)
                            }));
                            setSelectedProjectMembers(membersWithUsers);
                            setMembersModalType('project');
                            setMembersModalTitle(`Thành viên của ${item.name}`);
                            setShowMembersModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{projectMembers[item.id] || 0}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => {setSelectedProjectForUser(item); setShowAddUserModal(true);}} className="p-2 hover:bg-gray-100 rounded" title="Thêm nhân sự">
                            <UserPlus className="w-4 h-4 text-blue-600" />
                          </button>
                          {isRootFlag && (
                            <>
                              <button onClick={() => onEditProject(item)} className="p-2 hover:bg-gray-100 rounded" title="Sửa"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => onDeleteProject(item.id)} className="p-2 hover:bg-gray-100 rounded text-red-600" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedProjects.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-center text-gray-500" colSpan="5">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}

          {/* Tab: Phân công địa điểm */}
          {activeTab === 'assignments' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Phân công địa điểm cho dự án</h3>
              </div>

              {(loading || projectsLoading || orgsLoading) ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tên dự án</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Công ty</th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Địa điểm</th>
                        <th className="w-24 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((project) => (
                        <tr key={project.id} className="border-t hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{project.name}</td>
                          <td className="px-6 py-4">{orgs.find(o => o.id === project.orgId)?.name || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedProjectForLocation(project);
                                setShowAssignLocationModal(true);
                              }}
                              className="inline-flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">{projectLocations[project.id]?.length || 0} địa điểm</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <button 
                                onClick={() => {
                                  setSelectedProjectForLocation(project);
                                  setShowAssignLocationModal(true);
                                }}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="Phân công địa điểm"
                              >
                                <MapPinned className="w-4 h-4 text-blue-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td className="px-6 py-6 text-center text-gray-500" colSpan="4">Không có dự án nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination for Projects tab */}
        {activeTab === 'projects' && paginatedProjects.length > 0 && (
          <div className="px-6 pb-6 flex justify-center">
            <Pagination
              current={currentPage}
              total={filteredProjects.length}
              pageSize={itemsPerPage}
              showSizeChanger={false}
              showQuickJumper={false}
              showTotal={false}
              onChange={(page) => setCurrentPage(page)}
              className="ant-pagination-custom"
            />
          </div>
        )}
      </div>

      {/* Modal sửa/tạo dự án */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setEditing(null);
              setForm(defaultProjectForm);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editing ? 'Sửa dự án' : 'Thêm dự án mới'}
            </h3>
            <form onSubmit={submitProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên dự án</label>
                <input 
                  value={form.name} 
                  onChange={(e)=>setForm({...form, name: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea 
                  value={form.description} 
                  onChange={(e)=>setForm({...form, description: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  rows={3} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Công ty</label>
                <div className="flex gap-2">
                  <select 
                    value={form.orgId} 
                    onChange={(e)=>setForm({...form, orgId: e.target.value})} 
                    className="flex-1 border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Chọn công ty</option>
                    {filteredOrgs.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  {isRootFlag && (
                  <button 
                    type="button" 
                    onClick={() => setShowOrgForm(true)} 
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={()=>{setShowForm(false); setEditing(null); setForm(defaultProjectForm);}} 
                  className="px-3 py-2 rounded border"
                >
                  Hủy
                </button>
                <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white">
                  {editing ? 'Cập nhật' : 'Tạo dự án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal tạo/sửa org */}
      {showOrgForm && isRootFlag && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOrgForm(false);
              setOrgForm({ name: '', code: '', description: '' });
              setEditingOrg(null);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingOrg ? 'Sửa tổ chức' : 'Tạo tổ chức mới'}
            </h3>
            <form onSubmit={createNewOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên tổ chức *</label>
                <input 
                  value={orgForm.name} 
                  onChange={(e)=>setOrgForm({...orgForm, name: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mã tổ chức</label>
                <input 
                  value={orgForm.code || ''} 
                  onChange={(e)=>setOrgForm({...orgForm, code: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  placeholder="Để trống nếu không có"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea 
                  value={orgForm.description} 
                  onChange={(e)=>setOrgForm({...orgForm, description: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  rows={3} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ảnh tổ chức</label>
                <div className="space-y-2">
                  {orgForm.photoUrls && orgForm.photoUrls.length > 0 && !orgPhotoFile && (
                    <div className="relative inline-block">
                      <img src={orgForm.photoUrls[0]} alt="Current" className="w-32 h-32 object-cover rounded-lg border" />
                    </div>
                  )}
                  <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setOrgPhotoFile(file);
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2">
                      <Upload className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-700">{orgPhotoFile ? orgPhotoFile.name : 'Chọn ảnh...'}</span>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={()=>{setShowOrgForm(false); setOrgForm({ name: '', description: '' }); setEditingOrg(null);}} 
                  className="px-3 py-2 rounded border"
                >
                  Hủy
                </button>
                <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white" disabled={uploadingOrgPhoto}>
                  {uploadingOrgPhoto ? 'Đang tải lên...' : (editingOrg ? 'Cập nhật' : 'Tạo tổ chức')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Select User to Add */}
      {showAddUserModal && (selectedOrgForUser || selectedProjectForUser) && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddUserModal(false);
              setSelectedOrgForUser(null);
              setSelectedProjectForUser(null);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {selectedOrgForUser ? `Chọn nhân sự thêm vào tổ chức: ${selectedOrgForUser.name}` : `Chọn nhân sự thêm vào dự án: ${selectedProjectForUser.name}`}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tên</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tổ chức</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dự án</th>
                    <th className="w-24 px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const isAll = accessibleProjects === '*';
                    const apSet = new Set(isAll ? [] : (accessibleProjects || []));
                    const visible = (allUsers || []).filter(u => {
                      const uOrgs = userMemberships[u.id]?.orgs || [];
                      const uProjects = userMemberships[u.id]?.projects || [];
                      if (selectedOrgForUser) {
                        return uOrgs.includes(selectedOrgForUser.id) || uProjects.some(pid => (items.find(p => p.id === pid)?.orgId) === selectedOrgForUser.id);
                      }
                      if (selectedProjectForUser) {
                        return uProjects.includes(selectedProjectForUser.id);
                      }
                      if (isAll) return true;
                      return uProjects.some(pid => apSet.has(pid));
                    });
                    return visible.map((user) => {
                    // Get user's orgs and projects from memberships (real-time from orgs_members and projects_members)
                    const userOrgs = userMemberships[user.id]?.orgs || [];
                    const userProjects = userMemberships[user.id]?.projects || [];
                    const orgNames = userOrgs.map(orgId => orgs.find(o => o.id === orgId)?.name).filter(Boolean).join(', ') || '-';
                    const projectNames = userProjects.map(pId => items.find(p => p.id === pId)?.name).filter(Boolean).join(', ') || '-';
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{user.displayName || user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.role}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{orgNames}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{projectNames}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={async () => {
                              try {
                                if (selectedOrgForUser) {
                                  await addUserToOrg(user.id, selectedOrgForUser.id, user.role, [], currentUser.uid);
                                } else if (selectedProjectForUser) {
                                  const project = items.find(p => p.id === selectedProjectForUser.id);
                                  await addUserToProject(user.id, selectedProjectForUser.id, project.orgId, user.role, [], currentUser.uid);
                                }
                                // Reload memberships to show updated data
                                await loadUserMemberships();
                                await load();
                                // ✅ Toast message đã được handle trong hook
                              } catch (error) {
                                // Error đã được handle trong hook
                                console.error('Error adding user:', error);
                              }
                            }}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Thêm
                          </button>
                        </td>
                      </tr>
                    );
                  });
                  })()}
                  {allUsers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        Không có nhân sự nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setSelectedOrgForUser(null);
                  setSelectedProjectForUser(null);
                }}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
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
              setSelectedOrgMembers([]);
              setSelectedProjectMembers([]);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{membersModalTitle}</h3>
            
            {membersModalType === 'org' && (() => {
              const groupedByRole = selectedOrgMembers.reduce((acc, member) => {
                // Sử dụng role từ user profile thay vì từ orgs_members
                const role = member.user?.role || member.role || 'unknown';
                if (!acc[role]) acc[role] = [];
                acc[role].push(member);
                return acc;
              }, {});
              
              return (
                <div className="space-y-6">
                  {Object.keys(groupedByRole).map((role) => (
                    <div key={role} className="border-b pb-4 last:border-b-0">
                      <h4 className="text-md font-semibold mb-3 text-gray-700 uppercase">{role}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupedByRole[role].map((member, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {member.user?.photoUrl ? (
                              <img src={member.user.photoUrl} alt={member.user.displayName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">{member.user?.displayName?.charAt(0) || 'U'}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-sm">{member.user?.displayName || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{member.user?.email || '-'}</div>
                            </div>
                            <button
                              onClick={async () => {
                                const confirmed = await confirm(`Xóa ${member.user?.displayName || 'thành viên này'} khỏi ${membersModalType === 'org' ? 'tổ chức' : 'dự án'}?`);
                                if (!confirmed) return;
                                
                                try {
                                  if (membersModalType === 'org') {
                                    const orgId = member.orgId || (selectedOrgMembers[0]?.orgId);
                                    if (orgId) {
                                      await removeUserFromOrg(member.userId, orgId);
                                      // Reload members
                                      const members = await getOrgMembers(orgId);
                                      const userIds = members.map(m => m.userId);
                                      const users = await getUsersByIds(userIds);
                                      setSelectedOrgMembers(members.map(m => ({ ...m, user: users.find(u => u.id === m.userId) })));
                                    }
                                  } else {
                                    const projectId = member.projectId || (selectedProjectMembers[0]?.projectId);
                                    if (projectId) {
                                      await removeUserFromProject(member.userId, projectId);
                                      // Reload members
                                      const members = await getProjectMembers(projectId);
                                      const userIds = members.map(m => m.userId);
                                      const users = await getUsersByIds(userIds);
                                      setSelectedProjectMembers(members.map(m => ({ ...m, user: users.find(u => u.id === m.userId) })));
                                    }
                                  }
                                  await load();
                                } catch (error) {
                                  console.error('Error removing member:', error);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa thành viên"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(groupedByRole).length === 0 && (
                    <div className="text-center py-8 text-gray-500">Không có thành viên</div>
                  )}
                </div>
              );
            })()}
            
            {membersModalType === 'project' && (() => {
              const groupedByRole = selectedProjectMembers.reduce((acc, member) => {
                // Sử dụng role từ user profile thay vì từ projects_members
                const role = member.user?.role || member.role || 'unknown';
                if (!acc[role]) acc[role] = [];
                acc[role].push(member);
                return acc;
              }, {});
              
              return (
                <div className="space-y-6">
                  {Object.keys(groupedByRole).map((role) => (
                    <div key={role} className="border-b pb-4 last:border-b-0">
                      <h4 className="text-md font-semibold mb-3 text-gray-700 uppercase">{role}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupedByRole[role].map((member, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {member.user?.photoUrl ? (
                              <img src={member.user.photoUrl} alt={member.user.displayName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">{member.user?.displayName?.charAt(0) || 'U'}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-sm">{member.user?.displayName || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{member.user?.email || '-'}</div>
                            </div>
                            <button
                              onClick={async () => {
                                const confirmed = await confirm(`Xóa ${member.user?.displayName || 'thành viên này'} khỏi ${membersModalType === 'org' ? 'tổ chức' : 'dự án'}?`);
                                if (!confirmed) return;
                                
                                try {
                                  if (membersModalType === 'org') {
                                    const orgId = member.orgId || (selectedOrgMembers[0]?.orgId);
                                    if (orgId) {
                                      await removeUserFromOrg(member.userId, orgId);
                                      // Reload members
                                      const members = await getOrgMembers(orgId);
                                      const userIds = members.map(m => m.userId);
                                      const users = await getUsersByIds(userIds);
                                      setSelectedOrgMembers(members.map(m => ({ ...m, user: users.find(u => u.id === m.userId) })));
                                    }
                                  } else {
                                    const projectId = member.projectId || (selectedProjectMembers[0]?.projectId);
                                    if (projectId) {
                                      await removeUserFromProject(member.userId, projectId);
                                      // Reload members
                                      const members = await getProjectMembers(projectId);
                                      const userIds = members.map(m => m.userId);
                                      const users = await getUsersByIds(userIds);
                                      setSelectedProjectMembers(members.map(m => ({ ...m, user: users.find(u => u.id === m.userId) })));
                                    }
                                  }
                                  await load();
                                } catch (error) {
                                  console.error('Error removing member:', error);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa thành viên"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(groupedByRole).length === 0 && (
                    <div className="text-center py-8 text-gray-500">Không có thành viên</div>
                  )}
                </div>
              );
            })()}
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedOrgMembers([]);
                  setSelectedProjectMembers([]);
                }}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phân công địa điểm */}
      {showAssignLocationModal && selectedProjectForLocation && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAssignLocationModal(false);
              setSelectedProjectForLocation(null);
              setLocationModalSearch('');
              setLocationModalProvince('');
              setLocationModalDistrict('');
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Phân công địa điểm cho: {selectedProjectForLocation.name}
              </h3>
              <button
                onClick={() => {
                  setShowAssignLocationModal(false);
                  setSelectedProjectForLocation(null);
                  setLocationModalSearch('');
                  setLocationModalProvince('');
                  setLocationModalDistrict('');
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* List of assigned locations */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Địa điểm đã phân công ({projectLocations[selectedProjectForLocation.id]?.length || 0})</h4>
                {projectLocations[selectedProjectForLocation.id]?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {projectLocations[selectedProjectForLocation.id].map(locationId => {
                      const location = locations.find(l => l.id === locationId);
                      if (!location) return null;
                      
                      return (
                        <div key={locationId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">{location.name}</div>
                              <div className="text-xs text-gray-500">{location.code}</div>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                // ✅ Confirm và toast đã được handle trong hook
                                await deleteProjectLocation(selectedProjectForLocation.id, locationId);
                                await load();
                              } catch (error) {
                                // Error đã được handle trong hook
                                console.error('Error in deleteProjectLocation:', error);
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Bỏ phân công"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">Chưa có địa điểm nào được phân công</p>
                )}
              </div>
              
              {/* Add locations section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Thêm địa điểm</h4>
                <div className="mb-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        type="text"
                        placeholder="Tìm kiếm..." 
                        value={locationModalSearch}
                        onChange={(e) => setLocationModalSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <select
                        value={locationModalProvince}
                        onChange={(e) => setLocationModalProvince(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Tất cả tỉnh/thành --</option>
                        {provinces.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={locationModalDistrict}
                        onChange={(e) => setLocationModalDistrict(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Tất cả quận/huyện --</option>
                        {districts.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {locations
                    .filter(loc => !projectLocations[selectedProjectForLocation.id]?.includes(loc.id))
                    .filter(loc => {
                      // Filter by search
                      if (locationModalSearch) {
                        const search = locationModalSearch.toLowerCase();
                        const matchesSearch = 
                          (loc.name || '').toLowerCase().includes(search) ||
                          (loc.code || '').toLowerCase().includes(search) ||
                          (loc.locationMark?.formattedAddress || loc.locationMark?.address || '').toLowerCase().includes(search);
                        if (!matchesSearch) return false;
                      }
                      
                      // Filter by province
                      if (locationModalProvince) {
                        if (loc.locationMark?.province !== locationModalProvince) return false;
                      }
                      
                      // Filter by district
                      if (locationModalDistrict) {
                        if (loc.locationMark?.district !== locationModalDistrict) return false;
                      }
                      
                      return true;
                    })
                    .map(location => (
                    <div key={location.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-sm">{location.name}</div>
                          <div className="text-xs text-gray-500">{location.code} • {location.locationMark?.formattedAddress || location.locationMark?.address || '-'}</div>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await createProjectLocation({
                              projectId: selectedProjectForLocation.id,
                              locationId: location.id,
                              orgId: selectedProjectForLocation.orgId,
                              locationName: location.name
                            }, currentUser);
                            await load();
                            // ✅ Toast message đã được handle trong hook
                            setLocationModalSearch('');
                            setLocationModalProvince('');
                            setLocationModalDistrict('');
                          } catch (error) {
                            // Error đã được handle trong hook
                            console.error('Error in createProjectLocation:', error);
                          }
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Thêm
                      </button>
                    </div>
                  ))}
                  {locations
                    .filter(loc => !projectLocations[selectedProjectForLocation.id]?.includes(loc.id))
                    .filter(loc => {
                      // Filter by search
                      if (locationModalSearch) {
                        const search = locationModalSearch.toLowerCase();
                        const matchesSearch = 
                          (loc.name || '').toLowerCase().includes(search) ||
                          (loc.code || '').toLowerCase().includes(search) ||
                          (loc.locationMark?.formattedAddress || loc.locationMark?.address || '').toLowerCase().includes(search);
                        if (!matchesSearch) return false;
                      }
                      
                      // Filter by province
                      if (locationModalProvince) {
                        if (loc.locationMark?.province !== locationModalProvince) return false;
                      }
                      
                      // Filter by district
                      if (locationModalDistrict) {
                        if (loc.locationMark?.district !== locationModalDistrict) return false;
                      }
                      
                      return true;
                    }).length === 0 && (
                    <p className="text-center py-4 text-gray-500 text-sm">
                      {locationModalSearch || locationModalProvince || locationModalDistrict ? 'Không tìm thấy địa điểm nào' : 'Tất cả địa điểm đã được phân công'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAssignLocationModal(false);
                  setSelectedProjectForLocation(null);
                  setLocationModalSearch('');
                  setLocationModalProvince('');
                  setLocationModalDistrict('');
                }}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
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



