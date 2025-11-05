import { useEffect, useMemo, useState } from 'react';
// ✅ Clean Architecture: Sử dụng Custom Hooks
import { useLocations } from '../hooks/useLocations';
import { useOrgs } from '../hooks/useOrgs';
import { useProjects } from '../hooks/useProjects';
// ❌ TODO: listUsers và locationsMembers vẫn import trực tiếp
import { listUsers } from '../../infrastructure/repositories/usersRepository';
import { getLocationMembers, addUserToLocation, removeUserFromLocation, getUsersByIds } from '../../infrastructure/repositories/locationsMembersRepository';
import { createDefaultLocationMark, createDefaultWarehouseProperties } from '../../infrastructure/repositories/locationsRepository';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/common/Toaster';
import { confirm } from '../components/common/ConfirmDialog';
import { Plus, Pencil, Trash2, Search, MapPin, Building, Package, CheckCircle, AlertTriangle, XCircle, Users, UserPlus, MapPinned, Check } from 'lucide-react';
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
  // address: '',  // Removed - use locationMark.address instead
  availableStock: true,
  tags: [],
  locationMark: createDefaultLocationMark(),
  warehouseProperties: createDefaultWarehouseProperties()
};

const statusOptions = [
  { value: 'sitecheck', label: 'Chờ kiểm tra' },
  { value: 'accepted', label: 'Cho phép' },
  { value: 'denied', label: 'Từ chối' },
  { value: 'closed', label: 'Đóng cửa' },
  { value: 'confirm', label: 'Xác nhận' }
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
  
  // ✅ Clean Architecture: Sử dụng Custom Hooks
  const {
    locations: items,  // Rename để giữ tương thích với code cũ
    loading: locationsLoading,
    createLocation: createLocationHook,
    updateLocation: updateLocationHook,
    deleteLocation: deleteLocationHook,
    refresh: refreshLocations
  } = useLocations({ accessibleProjectIds: accessibleProjects });

  const {
    orgs,
    loading: orgsLoading,
    createOrg: createOrgHook
  } = useOrgs();

  const {
    projects,
    loading: projectsLoading
  } = useProjects({ accessibleProjectIds: accessibleProjects });

  const [allUsers, setAllUsers] = useState([]);
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
  
  // Tab states
  const [activeTab, setActiveTab] = useState('locations');
  
  // Assignment states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLocationMemberships, setUserLocationMemberships] = useState({});

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
    // ✅ Locations, Orgs, và Projects được load tự động bởi hooks
    // Chỉ cần load users
    const usersList = await listUsers();
    setAllUsers(usersList);
    setLoading(false);
  };

  // Load user location memberships
  const loadUserLocationMemberships = async () => {
    const { getUserLocations } = await import('../../infrastructure/repositories/locationsMembersRepository');
    const memberships = {};
    
    for (const user of allUsers) {
      try {
        const userLocs = await getUserLocations(user.id);
        memberships[user.id] = userLocs;
      } catch (error) {
        console.error(`Error loading locations for user ${user.id}:`, error);
        memberships[user.id] = [];
      }
    }
    
    setUserLocationMemberships(memberships);
  };

  // Handle assign user to locations
  const handleAssignUserToLocations = async (user, selectedLocationIds) => {
    if (!selectedLocationIds || selectedLocationIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một địa điểm');
      return;
    }

    try {
      for (const locationId of selectedLocationIds) {
        const location = items.find(loc => loc.id === locationId);
        if (!location) continue;

        await addUserToLocation(
          user.id,
          locationId,
          location.projectId,
          location.orgId,
          {
            code: location.code,
            name: location.name || location.locationName,
            address: location.locationMark?.address || location.locationMark?.formattedAddress
          }
        );
      }

      toast.success('Phân công địa điểm thành công!');
      setShowAssignModal(false);
      setSelectedUser(null);
      await loadUserLocationMemberships();
    } catch (error) {
      console.error('Error assigning locations:', error);
      toast.error('Có lỗi xảy ra khi phân công địa điểm');
    }
  };

  // Handle remove user from location
  const handleRemoveUserFromLocation = async (userId, locationId, projectId) => {
    const confirmed = await confirm('Bạn có chắc muốn xóa phân công này?');
    if (!confirmed) return;

    try {
      await removeUserFromLocation(userId, locationId, projectId);
      toast.success('Đã xóa phân công địa điểm');
      await loadUserLocationMemberships();
    } catch (error) {
      console.error('Error removing location assignment:', error);
      toast.error('Có lỗi xảy ra khi xóa phân công');
    }
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
      let success = 0, failed = 0, duplicates = 0;
      
      // Create a set of existing location IDs for duplicate detection
      const existingLocationIds = new Set(items.map(loc => loc.id));
      
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

        // Check for duplicates using projectId_code format
        const expectedId = projectId && code ? `${projectId}_${code}` : null;
        if (expectedId && existingLocationIds.has(expectedId)) {
          duplicates++;
          logs.push(`⚠️ Trùng lặp: ${name} (${code}) - Địa điểm đã tồn tại`);
          continue;
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
          // ✅ Clean Architecture: Sử dụng hook method
          await createLocationHook(payload, currentUser);
          success++; 
          logs.push(`✓ OK: ${name} (${code})`);
          // Add to existing set to prevent duplicates within the same import batch
          if (expectedId) existingLocationIds.add(expectedId);
        } catch (e) {
          failed++; 
          logs.push(`✗ Lỗi ${name}: ${e.message || e}`);
        }
      }

      setImportLog([
        `📊 Kết quả import:`,
        `✓ Thành công: ${success} địa điểm`,
        `✗ Thất bại: ${failed} địa điểm`,
        `⚠️ Trùng lặp: ${duplicates} địa điểm`,
        `━━━━━━━━━━━━━━━━━━━━`,
        ...logs
      ]);
      await load();
    } catch (err) {
      setImportLog([`Lỗi import: ${err.message || err}`]);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => { load(); }, [accessibleProjects, items, orgs, projects]); // ✅ Reload khi data thay đổi

  // Load user location memberships when tab changes to assignment
  useEffect(() => {
    if (activeTab === 'assignment' && allUsers.length > 0) {
      loadUserLocationMemberships();
    }
  }, [activeTab, allUsers]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.code?.trim()) return;
    
    try {
      const isUpdating = !!editing;
      if (isUpdating) {
        // ✅ Clean Architecture: Sử dụng hook method
        await updateLocationHook(editing.id, form, currentUser);
      } else {
        // ✅ Clean Architecture: Sử dụng hook method
        await createLocationHook(form, currentUser);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      await load();
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Có lỗi xảy ra khi lưu địa điểm');
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

  const onDelete = async (item) => {
    const confirmed = await confirm('Xóa địa điểm này?');
    if (!confirmed) return;
    try {
      // ✅ Clean Architecture: Sử dụng hook method
      await deleteLocationHook(item.id);
      await load();
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Có lỗi xảy ra khi xóa địa điểm');
    }
  };

  const onConfirm = async (item) => {
    try {
      // ✅ Clean Architecture: Sử dụng hook method
      // Đổi từ 'confirm' thành 'accepted' (Cho phép)
      await updateLocationHook(item.id, { ...item, status: 'accepted' }, currentUser);
      await load();
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      console.error('Error confirming location:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const createNewOrg = async (e) => {
    e.preventDefault();
    if (!orgForm.name?.trim()) return;
    try {
      // ✅ Clean Architecture: Sử dụng hook method
      const newOrg = await createOrgHook(orgForm, currentUser);
      setOrgs([...orgs, newOrg]);
      setForm({...form, orgId: newOrg.id});
      setShowOrgForm(false);
      setOrgForm({ name: '', description: '' });
      toast.success('Đã tạo tổ chức mới thành công!');
    } catch (error) {
      console.error('Error creating org:', error);
      toast.error('Có lỗi xảy ra khi tạo tổ chức');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'denied': return 'text-red-600 bg-red-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      case 'sitecheck': return 'text-yellow-600 bg-yellow-100';
      case 'confirm': return 'text-blue-600 bg-blue-100';
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

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('locations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'locations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Địa điểm
            </button>
            <button
              onClick={() => setActiveTab('assignment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Phân công nhân sự
            </button>
          </nav>
        </div>

        {/* Tab: Locations */}
        {activeTab === 'locations' && (
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

          {(loading || locationsLoading || orgsLoading || projectsLoading) ? (
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
                          {getStatusLabel(item.status)}
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
                          <button onClick={() => onConfirm(item)} className="p-2 hover:bg-gray-100 rounded text-green-600" title="Cho phép">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(item)} className="p-2 hover:bg-gray-100 rounded">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(item)} className="p-2 hover:bg-gray-100 rounded text-red-600">
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
        </div>
        )}

        {/* Tab: Assignment */}
        {activeTab === 'assignment' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Phân công nhân sự theo địa điểm</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Địa điểm phụ trách</th>
                  <th className="w-24 px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user) => {
                  const userLocs = userLocationMemberships[user.id] || [];
                  const locationNames = userLocs.map(loc => {
                    const location = items.find(l => l.id === loc.locationId);
                    return location?.name || location?.locationName || loc.locationId;
                  }).join(', ') || '-';
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{user.displayName || user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {userLocs.length > 0 ? (
                          <div className="space-y-1">
                            {userLocs.slice(0, 3).map(loc => {
                              const location = items.find(l => l.id === loc.locationId);
                              return (
                                <div key={loc.id} className="flex items-center gap-2">
                                  <span>{location?.name || location?.locationName || loc.locationId}</span>
                                  <button
                                    onClick={() => handleRemoveUserFromLocation(user.id, loc.locationId, loc.projectId)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                            {userLocs.length > 3 && (
                              <span className="text-xs text-gray-500">+{userLocs.length - 3} địa điểm khác</span>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowAssignModal(true);
                          }}
                          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex"
                          title="Phân công địa điểm"
                        >
                          <MapPinned className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {allUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      Không có nhân sự nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

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
                  value={form.locationMark?.address || ''} 
                  onChange={(e)=>setForm({...form, locationMark: {...form.locationMark, address: e.target.value}})} 
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

      {/* Modal Assign Locations */}
      {showAssignModal && selectedUser && (
        <AssignLocationsModal
          user={selectedUser}
          locations={items}
          projects={projects}
          userLocationMemberships={userLocationMemberships[selectedUser.id] || []}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedUser(null);
          }}
          onAssign={handleAssignUserToLocations}
        />
      )}
    </div>
  );
}

// Component: AssignLocationsModal
function AssignLocationsModal({ user, locations, projects, userLocationMemberships, onClose, onAssign }) {
  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const [modalSearch, setModalSearch] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  const handleToggleLocation = (locationId) => {
    setSelectedLocationIds(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  const handleSubmit = () => {
    onAssign(user, selectedLocationIds);
  };

  // Extract unique provinces and districts
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

  // Filter locations by search, province, and district
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      // Filter by search
      if (modalSearch) {
        const search = modalSearch.toLowerCase();
        const matchesSearch = 
          (loc.name || loc.locationName || '').toLowerCase().includes(search) ||
          (loc.code || '').toLowerCase().includes(search) ||
          (loc.locationMark?.formattedAddress || loc.locationMark?.address || '').toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Filter by province
      if (filterProvince) {
        if (loc.locationMark?.province !== filterProvince) return false;
      }
      
      // Filter by district
      if (filterDistrict) {
        if (loc.locationMark?.district !== filterDistrict) return false;
      }
      
      return true;
    });
  }, [locations, modalSearch, filterProvince, filterDistrict]);

  // Group locations by project
  const locationsByProject = filteredLocations.reduce((acc, loc) => {
    const projectId = loc.projectId || 'Không có dự án';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(loc);
    return acc;
  }, {});

  // Get already assigned location IDs
  const assignedLocationIds = userLocationMemberships.map(m => m.locationId);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            Phân công địa điểm cho: {user.displayName || user.email}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Chọn các địa điểm mà nhân viên này sẽ phụ trách
          </p>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text"
                  placeholder="Tìm kiếm..." 
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterProvince}
                  onChange={(e) => setFilterProvince(e.target.value)}
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
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
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
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {Object.keys(locationsByProject).length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Không có địa điểm nào
            </div>
          ) : (
            Object.entries(locationsByProject).map(([projectId, locs]) => {
              const project = projects.find(p => p.id === projectId);
              return (
              <div key={projectId} className="mb-6">
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  Dự án: {project ? project.name : projectId}
                </h4>
                <div className="space-y-2">
                  {locs.map(loc => {
                    const isAssigned = assignedLocationIds.includes(loc.id);
                    const isSelected = selectedLocationIds.includes(loc.id);
                    
                    return (
                      <label
                        key={loc.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          isAssigned ? 'bg-blue-50 border-blue-300' : ''
                        } ${isSelected ? 'bg-green-50 border-green-500' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleLocation(loc.id)}
                          disabled={isAssigned}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {loc.name || loc.locationName}
                            {isAssigned && (
                              <span className="ml-2 text-xs text-blue-600">(Đã phân công)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {loc.code} - {loc.locationMark?.address || loc.locationMark?.formattedAddress || 'N/A'}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Đã chọn: <span className="font-semibold">{selectedLocationIds.length}</span> địa điểm
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedLocationIds.length === 0}
              className={`px-4 py-2 rounded-lg ${
                selectedLocationIds.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Phân công
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
