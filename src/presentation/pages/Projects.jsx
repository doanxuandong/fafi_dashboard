import { useEffect, useMemo, useState } from 'react';
import { listProjects, createProject, updateProject, deleteProject } from '../../infrastructure/repositories/projectsRepository';
import { listOrgs, createOrg } from '../../infrastructure/repositories/orgsRepository';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Pencil, Trash2, Search, Building, BarChart3, Package, Calendar } from 'lucide-react';
import { Pagination } from 'antd';

const defaultForm = { name: '', description: '', orgId: '', tags: [] };

export default function Projects() {
  const { currentUser, accessibleProjects, isRoot } = useAuth();
  const [isRootFlag, setIsRootFlag] = useState(false);
  const [items, setItems] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', description: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const filtered = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(i => (i.keywords || []).some(k => k.includes(s)) || (i.name || '').toLowerCase().includes(s));
  }, [items, search]);

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
    const [data, orgList] = await Promise.all([
      listProjects({ accessibleProjectIds: accessibleProjects }),
      listOrgs()
    ]);
    setItems(data);
    // Non-root: limit orgs to those that have at least one accessible project
    if (accessibleProjects === '*' ) {
      setOrgs(orgList);
    } else {
      const accessibleSet = new Set((data || []).map(p => p.orgId));
      setOrgs((orgList || []).filter(o => accessibleSet.has(o.id)));
    }
    setLoading(false);
  };

  useEffect(() => { (async () => { setIsRootFlag(await isRoot()); await load(); })(); }, [accessibleProjects]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    if (editing) {
      await updateProject(editing.id, form, currentUser);
    } else {
      await createProject(form, currentUser);
    }
    setShowForm(false);
    setEditing(null);
    setForm(defaultForm);
    await load();
  };

  const onEdit = (item) => {
    setEditing(item);
    setForm({ 
      name: item.name || '', 
      description: item.description || '', 
      orgId: item.orgId || '', 
      tags: item.tags || []
    });
    setShowForm(true);
  };

  const onDelete = async (id) => {
    if (!confirm('Xóa dự án này?')) return;
    await deleteProject(id);
    await load();
  };

  const createNewOrg = async (e) => {
    e.preventDefault();
    if (!orgForm.name?.trim()) return;
    try {
      const newOrg = await createOrg(orgForm, currentUser);
      setOrgs([...orgs, newOrg]);
      setForm({...form, orgId: newOrg.id});
      setShowOrgForm(false);
      setOrgForm({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating org:', error);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý dự án</h1>
          <p className="text-gray-600">Quản lý danh sách dự án theo công ty</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Building className="w-5 h-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Tổng công ty</p>
              <p className="text-xl font-semibold">{totalOrgs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Số tag khác nhau</p>
              <p className="text-xl font-semibold">{uniqueTags}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Tạo mới trong tháng</p>
              <p className="text-xl font-semibold">{projectsThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
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
              <button onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm); }} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Thêm dự án</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tên dự án</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Công ty</th>
                    <th className="w-24 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-gray-600">{item.description}</td>
                      <td className="px-6 py-4">{orgs.find(o => o.id === item.orgId)?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => onEdit(item)} className="p-2 hover:bg-gray-100 rounded"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(item.id)} className="p-2 hover:bg-gray-100 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-center text-gray-500" colSpan="4">Không có dữ liệu</td>
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

      {/* Modal sửa/tạo dự án */}
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
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editing ? 'Sửa dự án' : 'Thêm dự án mới'}
            </h3>
            <form onSubmit={submit} className="space-y-4">
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
                    {orgs.map(org => (
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
                  onClick={()=>{setShowForm(false); setEditing(null); setForm(defaultForm);}} 
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

      {/* Modal tạo org nhanh */}
      {showOrgForm && isRootFlag && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOrgForm(false);
              setOrgForm({ name: '', description: '' });
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Tạo công ty mới</h3>
            <form onSubmit={createNewOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên công ty</label>
                <input 
                  value={orgForm.name} 
                  onChange={(e)=>setOrgForm({...orgForm, name: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  required 
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
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={()=>{setShowOrgForm(false); setOrgForm({ name: '', description: '' });}} 
                  className="px-3 py-2 rounded border"
                >
                  Hủy
                </button>
                <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white">
                  Tạo công ty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


