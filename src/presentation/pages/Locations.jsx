import { useEffect, useMemo, useState } from 'react';
import { listLocations, createLocation, updateLocation, deleteLocation, createDefaultLocationMark, createDefaultWarehouseProperties } from '../../infrastructure/repositories/locationsRepository';
import { listOrgs, createOrg } from '../../infrastructure/repositories/orgsRepository';
import { listProjects } from '../../infrastructure/repositories/projectsRepository';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Pencil, Trash2, Search, MapPin, Building, Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Pagination } from 'antd';

const defaultForm = { 
  name: '', 
  code: '', 
  orgId: '', 
  projectId: '',
  status: 'sitecheck',
  level: 0,
  type: '',
  tier: '',
  ownerName: '',
  ownerPhoneNumer: '',
  saleName: '',
  salePhoneNumber: '',
  saleTitle: '',
  address: '',
  availableStock: true,
  tags: [],
  locationMark: createDefaultLocationMark(),
  warehouseProperties: createDefaultWarehouseProperties()
};

const statusOptions = [
  { value: 'sitecheck', label: 'Chờ kiểm tra' },
  { value: 'accepted', label: 'Cho phép' },
  { value: 'denied', label: 'Từ chối' },
  { value: 'closed', label: 'Đóng cửa' }
];

const levelOptions = [
  { value: 0, label: 'Không cấp' },
  { value: 1, label: 'Kho trung tâm' },
  { value: 2, label: 'Kho tỉnh' },
  { value: 3, label: 'Kho vệ tinh' },
  { value: 4, label: 'Điểm bán' }
];

const saleTitleOptions = [
  { value: 'saleSup', label: 'Giám sát bán hàng' },
  { value: 'saleRep', label: 'Đại diện bán hàng' }
];

export default function Locations() {
  const { currentUser, accessibleProjects } = useAuth();
  const [items, setItems] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', description: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const filtered = useMemo(() => {
    const s = (search || '').toLowerCase();
    return (items || [])
      .filter(i => {
        if (!s) return true;
        return (i.keywords || []).some(k => (k || '').toLowerCase().includes(s)) ||
               (i.name || '').toLowerCase().includes(s) ||
               (i.code || '').toLowerCase().includes(s) ||
               (i.locationMark?.address || i.locationMark?.formattedAddress || '').toLowerCase().includes(s);
      })
      .filter(i => {
        if (!filterStatus) return true;
        return (i.status || '') === filterStatus;
      })
      .filter(i => {
        if (!filterLevel && filterLevel !== 0) return true;
        const lvl = Number(filterLevel);
        return Number(i.level || 0) === lvl;
      });
  }, [items, search, filterStatus, filterLevel]);

  // Stats overview
  const totalLocations = items.length;
  const acceptedCount = useMemo(() => items.filter(i => i.status === 'accepted').length, [items]);
  const sitecheckCount = useMemo(() => items.filter(i => i.status === 'sitecheck').length, [items]);
  const closedDeniedCount = useMemo(() => items.filter(i => i.status === 'closed' || i.status === 'denied').length, [items]);

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
    const [data, orgList, projectList] = await Promise.all([
      listLocations({ accessibleProjectIds: accessibleProjects }),
      listOrgs(),
      listProjects({ accessibleProjectIds: accessibleProjects })
    ]);
    // Filter locations by accessible projects (if not root '*')
    const filteredByAccess = accessibleProjects === '*' 
      ? data 
      : (data || []).filter(i => i.projectId && (accessibleProjects || []).includes(i.projectId));
    setItems(filteredByAccess);
    setOrgs(orgList);
    setProjects(projectList);
    setLoading(false);
  };

  // Import from Google Sheets (CSV)
  const handleImportFromSheet = async () => {
    if (!importUrl?.trim()) return;
    setImporting(true);
    setImportLog([]);
    try {
      const buildCsvUrl = (url) => {
        try {
          const u = new URL(url);
          // Already export csv
          if (u.pathname.includes('/export') && u.searchParams.get('format') === 'csv') return u.toString();
          // Standard sheet link -> convert to export csv
          const match = u.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
          if (match) {
            const sheetId = match[1];
            const gid = u.searchParams.get('gid');
            const base = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            return gid ? `${base}&gid=${gid}` : base;
          }
          return url;
        } catch {
          return url;
        }
      };

      const csvUrl = buildCsvUrl(importUrl.trim());
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`Không tải được CSV (${res.status})`);
      const csvText = await res.text();

      // Simple CSV parser with quoted values support
      const parseCsv = (text) => {
        const rows = [];
        let cur = '', row = [], inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            row.push(cur); cur = '';
          } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (cur.length || row.length) { row.push(cur); rows.push(row); row = []; cur = ''; }
          } else {
            cur += ch;
          }
        }
        if (cur.length || row.length) { row.push(cur); rows.push(row); }
        return rows.filter(r => r.some(c => (c || '').trim() !== ''));
      };

      const rows = parseCsv(csvText);
      if (!rows.length) throw new Error('CSV rỗng');
      const headers = rows[0].map(h => (h || '').trim().toLowerCase());
      const dataRows = rows.slice(1);

      const find = (obj, keys) => {
        for (const k of keys) { if (obj[k] != null && String(obj[k]).trim() !== '') return obj[k]; }
        return '';
      };

      const headerIndex = (name) => headers.indexOf(name);
      const toObj = (row) => headers.reduce((acc, h, idx) => { acc[h] = row[idx] ?? ''; return acc; }, {});

      const logs = [];
      let success = 0, failed = 0;
      for (const r of dataRows) {
        const obj = toObj(r);
        const name = find(obj, ['name','tên','ten']);
        const code = find(obj, ['code','mã','ma']);
        const projectIdRaw = find(obj, ['projectid','project_id','dự án id','du an id']);
        const projectNameRaw = find(obj, ['project','dự án','du an']);
        const address = find(obj, ['address','địa chỉ','dia chi']);
        const formattedAddress = find(obj, ['formattedaddress','formatted_address']);
        const status = find(obj, ['status','trạng thái','trang thai']);
        const levelText = find(obj, ['level','cấp','cap']);
        const type = find(obj, ['type','loại','loai']);
        const tier = find(obj, ['tier']);
        const ownerName = find(obj, ['ownername','chủ cửa hàng','chu cua hang']);
        const ownerPhone = find(obj, ['ownerphonenumer','ownerphone','sđt chủ','sdt chu']);
        const saleName = find(obj, ['salename']);
        const salePhoneNumber = find(obj, ['salephonenumber']);
        const saleTitle = find(obj, ['saletitle']);
        const orgId = find(obj, ['orgid']);
        const regionName = find(obj, ['regionname']);
        const regionCode = find(obj, ['regioncode']);
        const provinceName = find(obj, ['provincename']);
        const provinceCode = find(obj, ['provincecode']);
        const districtName = find(obj, ['districtname']);
        const districtCode = find(obj, ['districtcode']);
        const wardName = find(obj, ['wardname']);
        const wardCode = find(obj, ['wardcode']);
        const availableStockText = find(obj, ['availablestock','availablestocktrue']);
        const metaName = find(obj, ['meta.name','metaname']);

        if (!name || !code) { failed++; logs.push(`Bỏ qua: thiếu name/code (${name}/${code})`); continue; }

        // Resolve projectId
        let projectId = '';
        if (projectIdRaw) projectId = String(projectIdRaw).trim();
        else if (projectNameRaw) {
          const p = projects.find(x => (x.name || '').trim().toLowerCase() === String(projectNameRaw).trim().toLowerCase());
          if (p) projectId = p.id;
        }

        // Enforce access
        if (accessibleProjects !== '*') {
          const allowed = new Set(accessibleProjects || []);
          if (!projectId || !allowed.has(projectId)) { failed++; logs.push(`Bỏ qua ${name}: dự án không hợp lệ/không trong phạm vi`); continue; }
        }

        const toBool = (v) => {
          const s = String(v || '').trim().toLowerCase();
          if (!s) return defaultForm.availableStock;
          return ['true','1','yes','y','x'].includes(s);
        };
        const level = parseInt(levelText || '0', 10) || 0;
        const payload = {
          ...defaultForm,
          name, code,
          projectId: projectId || '',
          status: status || defaultForm.status,
          level,
          type: type || '',
          tier: tier || '',
          ownerName: ownerName || '',
          ownerPhoneNumer: ownerPhone || '',
          saleName: saleName || '',
          salePhoneNumber: salePhoneNumber || '',
          saleTitle: saleTitle || '',
          orgId: orgId || '',
          availableStock: availableStockText ? toBool(availableStockText) : defaultForm.availableStock,
          address: address || formattedAddress || '',
          locationMark: {
            ...defaultForm.locationMark,
            address: address || defaultForm.locationMark.address,
            formattedAddress: formattedAddress || undefined,
            ward: wardName ? { name: wardName, code: wardCode || 'N/A' } : undefined,
            district: districtName ? { name: districtName, code: districtCode || 'N/A' } : undefined,
            province: provinceName ? { name: provinceName, code: provinceCode || 'N/A' } : undefined,
            region: regionName ? { name: regionName, code: regionCode || 'N/A' } : undefined,
          },
        };
        if (metaName) payload.meta = { ...(payload.meta||{}), name: metaName };

        try {
          await createLocation(payload, currentUser);
          success++; logs.push(`OK: ${name}`);
        } catch (e) {
          failed++; logs.push(`Lỗi ${name}: ${e.message || e}`);
        }
      }

      setImportLog([`Hoàn tất: ${success} thành công, ${failed} thất bại`, ...logs]);
      await load();
    } catch (err) {
      setImportLog([`Lỗi import: ${err.message || err}`]);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => { load(); }, [accessibleProjects]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.code?.trim()) return;
    
    try {
      if (editing) {
        await updateLocation(editing.id, form, currentUser);
      } else {
        await createLocation(form, currentUser);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      await load();
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const onEdit = (item) => {
    setEditing(item);
    setForm({ 
      name: item.name || '', 
      code: item.code || '',
      orgId: item.orgId || '', 
      projectId: item.projectId || '',
      status: item.status || 'sitecheck',
      level: item.level || 0,
      type: item.type || '',
      tier: item.tier || '',
      ownerName: item.ownerName || '',
      ownerPhoneNumer: item.ownerPhoneNumer || '',
      saleName: item.saleName || '',
      salePhoneNumber: item.salePhoneNumber || '',
      saleTitle: item.saleTitle || '',
      address: item.locationMark?.address || '',
      availableStock: item.availableStock !== undefined ? item.availableStock : true,
      tags: item.tags || [],
      locationMark: item.locationMark || createDefaultLocationMark(),
      warehouseProperties: item.warehouseProperties || createDefaultWarehouseProperties()
    });
    setShowForm(true);
  };

  const onDelete = async (id) => {
    if (!confirm('Xóa địa điểm này?')) return;
    try {
      await deleteLocation(id);
      await load();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'denied': return 'text-red-600 bg-red-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      case 'sitecheck': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý địa điểm</h1>
          <p className="text-gray-600">Quản lý thông tin địa điểm và cửa hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Tổng địa điểm</p>
              <p className="text-xl font-semibold">{totalLocations}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Đang hoạt động</p>
              <p className="text-xl font-semibold">{acceptedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Chờ kiểm tra</p>
              <p className="text-xl font-semibold">{sitecheckCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Đóng cửa / Từ chối</p>
              <p className="text-xl font-semibold">{closedDeniedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Danh sách địa điểm</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Tìm kiếm địa điểm..." 
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e)=>setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={filterLevel}
                onChange={(e)=>setFilterLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Tất cả cấp độ</option>
                {levelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button 
                onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm); }} 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm địa điểm</span>
              </button>
              <button 
                onClick={() => setShowImport(!showImport)} 
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Package className="w-4 h-4" />
                <span>Import</span>
              </button>
            </div>
          </div>

          {showImport && (
            <div className="mb-4 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="Dán link Google Sheets (Publish/Share)"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                />
                <button
                  disabled={importing || !importUrl.trim()}
                  onClick={async () => { await handleImportFromSheet(); }}
                  className={`px-3 py-2 rounded-md ${importing ? 'bg-gray-300 text-gray-600' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {importing ? 'Đang import...' : 'Import'}
                </button>
                <button
                  onClick={() => { setShowImport(false); setImportUrl(''); setImportLog([]); }}
                  className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
                >
                  Đóng
                </button>
              </div>
              {importLog.length > 0 && (
                <div className="text-sm text-gray-600 max-h-40 overflow-y-auto mt-2 p-2 bg-white rounded border">
                  {importLog.map((l, idx) => (
                    <div key={idx}>{l}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Tên địa điểm</th>
                    <th className="text-left px-4 py-3">Mã</th>
                    <th className="text-left px-4 py-3">Trạng thái</th>
                    <th className="text-left px-4 py-3">Cấp độ</th>
                    <th className="text-left px-4 py-3">Địa chỉ</th>
                    <th className="w-24 px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-gray-600">{item.code}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {levelOptions.find(opt => opt.value === item.level)?.label || item.level}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="truncate max-w-xs">
                            {item.locationMark?.formattedAddress || item.locationMark?.address || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => onEdit(item)} className="p-2 hover:bg-gray-100 rounded">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(item.id)} className="p-2 hover:bg-gray-100 rounded text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan="6">Không có dữ liệu</td>
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

      {/* Form tạo/sửa location */}
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
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Cập nhật địa điểm' : 'Thêm địa điểm'}</h3>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên địa điểm *</label>
                  <input 
                    value={form.name} 
                    onChange={(e)=>setForm({...form, name: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mã địa điểm *</label>
                  <input 
                    value={form.code} 
                    onChange={(e)=>setForm({...form, code: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Công ty</label>
                  <div className="flex gap-2">
                    <select 
                      value={form.orgId} 
                      onChange={(e)=>setForm({...form, orgId: e.target.value})} 
                      className="flex-1 border rounded-lg px-3 py-2"
                    >
                      <option value="">-- Chọn công ty --</option>
                      {orgs.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      onClick={() => setShowOrgForm(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                    >
                      Tạo mới
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dự án</label>
                  <select 
                    value={form.projectId} 
                    onChange={(e)=>setForm({...form, projectId: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select 
                    value={form.status} 
                    onChange={(e)=>setForm({...form, status: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cấp độ</label>
                  <select 
                    value={form.level} 
                    onChange={(e)=>setForm({...form, level: parseInt(e.target.value)})} 
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {levelOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loại</label>
                  <input 
                    value={form.type} 
                    onChange={(e)=>setForm({...form, type: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="GT, MT, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                <textarea 
                  value={form.address} 
                  onChange={(e)=>setForm({...form, address: e.target.value, locationMark: {...form.locationMark, address: e.target.value}})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  rows={2}
                  placeholder="Địa chỉ chi tiết"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Chủ sở hữu</label>
                  <input 
                    value={form.ownerName} 
                    onChange={(e)=>setForm({...form, ownerName: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="Tên chủ sở hữu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                  <input 
                    value={form.ownerPhoneNumer} 
                    onChange={(e)=>setForm({...form, ownerPhoneNumer: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="Số điện thoại chủ sở hữu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên nhân viên bán hàng</label>
                  <input 
                    value={form.saleName} 
                    onChange={(e)=>setForm({...form, saleName: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="Tên nhân viên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SĐT nhân viên</label>
                  <input 
                    value={form.salePhoneNumber} 
                    onChange={(e)=>setForm({...form, salePhoneNumber: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="Số điện thoại nhân viên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Chức vụ</label>
                  <select 
                    value={form.saleTitle} 
                    onChange={(e)=>setForm({...form, saleTitle: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    {saleTitleOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={form.availableStock} 
                    onChange={(e)=>setForm({...form, availableStock: e.target.checked})} 
                    className="mr-2"
                  />
                  Có hàng tồn kho
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={()=>{setShowForm(false); setEditing(null);}} 
                  className="px-4 py-2 rounded border"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-indigo-600 text-white"
                >
                  {editing ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal tạo org nhanh */}
      {showOrgForm && (
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
