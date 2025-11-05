import React, { useEffect, useMemo, useState } from 'react';
import { Resource, PermissionAction, UserRole } from '../../infrastructure/services/permissionService';
// ✅ Clean Architecture: Sử dụng Custom Hooks
import { useACLs } from '../hooks/useACLs';
import { useProjects } from '../hooks/useProjects';
import { useOrgs } from '../hooks/useOrgs';
// ❌ TODO: getProjectById vẫn import trực tiếp
import { getProjectById } from '../../infrastructure/repositories/projectsRepository';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/common/Toaster';
import { confirm } from '../components/common/ConfirmDialog';
import { Pagination } from 'antd';

export default function Permissions() {
  const { currentUser, accessibleProjects } = useAuth();

  const [orgId, setOrgId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectLoading, setProjectLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    role: 'promoter',
    resource: 'project',
    permissionActions: [],
  });

  const RESOURCES = useMemo(() => Object.values(Resource), []);
  const ACTIONS = useMemo(() => Object.values(PermissionAction), []);
  const ROLES = useMemo(() => Object.values(UserRole), []);

  // ✅ Clean Architecture: Sử dụng Custom Hooks
  const {
    rules,
    loading,
    createRule: createRuleHook,
    updateRule: updateRuleHook,
    deleteRule: deleteRuleHook,
    refresh: refreshACLs
  } = useACLs({ orgId: orgId || undefined, projectId: projectId || undefined });

  const {
    orgs,
    loading: orgsLoading
  } = useOrgs();

  const {
    projects,
    loading: projectsLoading
  } = useProjects({ accessibleProjectIds: accessibleProjects, orgId: orgId || undefined });

  // Load project name when projectId changes
  useEffect(() => {
    let active = true;
    async function loadProject() {
      if (!projectId?.trim()) {
        setProjectName('');
        return;
      }
      setProjectLoading(true);
      try {
        const p = await getProjectById(projectId.trim());
        if (!active) return;
        setProjectName(p?.name || '(không tìm thấy dự án)');
      } catch (e) {
        if (!active) return;
        setProjectName('(lỗi tải dự án)');
      } finally {
        if (active) setProjectLoading(false);
      }
    }
    loadProject();
    return () => { active = false; };
  }, [projectId]);

  // Reset selected project when org changes
  useEffect(() => {
    setProjectId('');
    setProjectName('');
  }, [orgId]);

  // Reset to page 1 when search/org/project changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, orgId, projectId]);

  // Set first org if none selected
  useEffect(() => {
    if (!orgId && orgs.length > 0) {
      setOrgId(orgs[0].id);
    }
  }, [orgId, orgs]);

  // If currently selected project is out of scope, reset it
  useEffect(() => {
    if (projectId && projects.length > 0 && projects.every(p => p.id !== projectId)) {
      setProjectId('');
      setProjectName('');
    }
  }, [projectId, projects]);

  function startCreate() {
    setEditing(null);
    setForm({ role: 'promoter', resource: 'project', permissionActions: [] });
  }

  function startEdit(rule) {
    setEditing(rule);
    setForm({ role: rule.role, resource: rule.resource, permissionActions: rule.permissionActions || [] });
  }

  // ✅ Clean Architecture: Sử dụng hook methods
  async function handleSave(e) {
    e?.preventDefault?.();
    const payload = {
      orgId: orgId || 'default',
      projectId: projectId || null,
      role: form.role,
      resource: form.resource,
      permissionActions: form.permissionActions,
    };
    if (!currentUser) return;

    // Validate role belongs to supported enum (Mobile compatible)
    if (!ROLES.includes(payload.role)) {
      toast.error('Role không hợp lệ. Vui lòng chọn vai trò hợp lệ.');
      return;
    }

    try {
      const isUpdating = !!editing;
      if (isUpdating) {
        await updateRuleHook(editing.id, payload, currentUser);
      } else {
        await createRuleHook(payload, currentUser);
      }
      setEditing(null);
      setForm({ role: 'promoter', resource: 'project', permissionActions: [] });
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in handleSave:', error);
    }
  }

  async function handleDelete(rule) {
    try {
      // ✅ Clean Architecture: Sử dụng hook method (confirm đã handle trong hook)
      await deleteRuleHook(rule.id);
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in handleDelete:', error);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter(r =>
      (r.role || '').toLowerCase().includes(q) ||
      (r.resource || '').toLowerCase().includes(q) ||
      (r.permissionActions || []).join(',').toLowerCase().includes(q)
    );
  }, [rules, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex]);

  function toggleAction(action) {
    setForm(prev => {
      const exists = prev.permissionActions.includes(action);
      return {
        ...prev,
        permissionActions: exists
          ? prev.permissionActions.filter(a => a !== action)
          : [...prev.permissionActions, action],
      };
    });
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Phân quyền</h1>
        <p className="text-sm text-gray-500">Quản lý quyền truy cập theo vai trò cho từng tổ chức/dự án</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-1">Công ty (Org)</label>
          <select
            className="w-full border rounded px-3 py-2 bg-white"
            value={orgId}
            onChange={e => setOrgId(e.target.value)}
          >
            {orgs.length === 0 && <option value="">-- Chưa có công ty --</option>}
            {orgs.map(o => (
              <option key={o.id} value={o.id}>{o.name || o.id}</option>
            ))}
          </select>
          <div className="mt-1 text-xs text-gray-500">
            {orgsLoading ? 'Đang tải danh sách công ty...' : orgId ? `Đã chọn: ${orgs.find(o=>o.id===orgId)?.name || orgId}` : 'Chưa chọn công ty'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-1">Dự án (Project)</label>
          <select
            className="w-full border rounded px-3 py-2 bg-white"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          >
            <option value="">-- Tất cả dự án (áp dụng toàn org) --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name || p.id}</option>
            ))}
          </select>
          <div className="mt-1 text-xs text-gray-500">
            {projectsLoading ? 'Đang tải danh sách dự án...' : projectId ? `Đã chọn: ${projectName || '-'}` : 'Không chọn dự án: rule áp dụng toàn org'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="role, resource, action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {(editing !== null || form.role || form.resource) && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="font-medium mb-4">{editing ? 'Sửa Rule' : 'Thêm Rule'}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.resource}
                onChange={e => setForm({ ...form, resource: e.target.value })}
              >
                {RESOURCES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Actions</label>
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAction(a)}
                    className={
                      'px-3 py-2 rounded border ' +
                      (form.permissionActions.includes(a) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50')
                    }
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded border"
                onClick={() => { setEditing(null); setForm({ role: 'promoter', resource: 'project', permissionActions: [] }); }}
              >Hủy</button>
              <button
                type="submit"
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >Lưu</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Danh sách Rule</h2>
          <button
            onClick={startCreate}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thêm Rule
          </button>
        </div>
        {loading ? (
          <div className="text-gray-500">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Resource</th>
                  <th className="py-2 pr-4">Actions</th>
                  <th className="py-2 pr-4 w-40">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(rule => (
                  <tr key={rule.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4">{rule.role}</td>
                    <td className="py-2 pr-4">{rule.resource}</td>
                    <td className="py-2 pr-4">{(rule.permissionActions || []).join(', ')}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 text-blue-600 hover:underline"
                          onClick={() => startEdit(rule)}
                        >Sửa</button>
                        <button
                          className="px-2 py-1 text-red-600 hover:underline"
                          onClick={() => handleDelete(rule)}
                        >Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">Không có rule</td>
                  </tr>
                )}
              </tbody>
            </table>
            {filtered.length > 0 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  current={currentPage}
                  total={filtered.length}
                  pageSize={itemsPerPage}
                  showSizeChanger={false}
                  onChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
