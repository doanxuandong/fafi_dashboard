import { useEffect, useMemo, useState } from 'react';
import { listSales, createSale, updateSale, deleteSale, calculateTotalAmount, calculateTotalQuantity } from '../../infrastructure/repositories/salesRepository';
import { listProjects } from '../../infrastructure/repositories/projectsRepository';
import { listLocations } from '../../infrastructure/repositories/locationsRepository';
import { uploadOrgPhoto } from '../../infrastructure/repositories/orgsRepository';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/common/Toaster';
import { confirm } from '../components/common/ConfirmDialog';
import { Plus, Pencil, Trash2, Search, ShoppingCart, Receipt, Package, MapPin, Calendar, DollarSign, Hash, Eye, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Pagination } from 'antd';

const defaultForm = { 
  locationId: '', 
  locationName: '',
  projectId: '', 
  sessionId: '',
  buyerId: '',
  buyerName: '',
  buyerPhone: '',
  buyProducts: [],
  getPremiums: [],
  notes: '', 
  otpCode: '',
  billPhotos: [],
  photos: []
};

export default function Sales() {
  const { currentUser, accessibleProjects } = useAuth();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showDetails, setShowDetails] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(i => 
      (i.keywords || []).some(k => k.includes(s)) || 
      (i.notes || '').toLowerCase().includes(s) ||
      (i.otpCode || '').toLowerCase().includes(s) ||
      (i.buyerId || '').toLowerCase().includes(s)
    );
  }, [items, search]);

  // Stats
  const totalSales = items.length;
  const statsTotalAmount = useMemo(() => (items || []).reduce((sum, it) => sum + (calculateTotalAmount(it.buyProducts) || 0), 0), [items]);
  const todaySales = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return (items || []).filter(it => {
      const d = it.createdAt?.toDate ? it.createdAt.toDate() : (it.createdAt?.seconds ? new Date(it.createdAt.seconds * 1000) : null);
      if (!d) return false; d.setHours(0,0,0,0); return d.getTime() === today.getTime();
    }).length;
  }, [items]);
  const uniqueBuyers = useMemo(() => new Set((items || []).map(i => i.buyerId).filter(Boolean)).size, [items]);

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
    const [data, projectList, locationList] = await Promise.all([
      listSales({ accessibleProjectIds: accessibleProjects }),
      listProjects({ accessibleProjectIds: accessibleProjects }),
      listLocations({ accessibleProjectIds: accessibleProjects })
    ]);
    setItems(data);
    setProjects(projectList);
    setLocations(locationList);
    setLoading(false);
  };

  useEffect(() => { load(); }, [accessibleProjects]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.locationId || !form.projectId) return;
    
    try {
      const userName = currentUser?.displayName || currentUser?.email || null;
      const isUpdating = !!editing;
      if (isUpdating) {
        await updateSale(editing.id, form, currentUser);
      } else {
        await createSale(form, currentUser, userName);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      await load();
      toast.success(isUpdating ? 'Đã cập nhật thông tin bán hàng thành công!' : 'Đã tạo thông tin bán hàng thành công!');
    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('Có lỗi xảy ra khi lưu thông tin bán hàng');
    }
  };

  const onEdit = (item) => {
    setEditing(item);
    setForm({ 
      locationId: item.locationId || '', 
      locationName: item.locationName || '',
      projectId: item.projectId || '', 
      sessionId: item.sessionId || '',
      buyerId: item.buyerId || '',
      buyerName: item.buyerName || '',
      buyerPhone: item.buyerPhone || '',
      buyProducts: item.buyProducts || [],
      getPremiums: item.getPremiums || [],
      notes: item.notes || '', 
      otpCode: item.otpCode || '',
      billPhotos: item.billPhotos || [],
      photos: item.photos || []
    });
    setShowForm(true);
  };

  const onDelete = async (id) => {
    const confirmed = await confirm('Xóa thông tin bán hàng này?');
    if (!confirmed) return;
    try {
      await deleteSale(id);
      await load();
      toast.success('Đã xóa thông tin bán hàng thành công!');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Có lỗi xảy ra khi xóa thông tin bán hàng');
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
      return '-';
    }
    
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

  const addProduct = () => {
    setForm({
      ...form,
      buyProducts: [...form.buyProducts, { id: '', name: '', qty: 1, moneyAmount: 0, unit: 'cái' }]
    });
  };

  const updateProduct = (index, field, value) => {
    const newProducts = [...form.buyProducts];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setForm({ ...form, buyProducts: newProducts });
  };

  const removeProduct = (index) => {
    const newProducts = form.buyProducts.filter((_, i) => i !== index);
    setForm({ ...form, buyProducts: newProducts });
  };

  const addPremium = () => {
    setForm({
      ...form,
      getPremiums: [...form.getPremiums, { id: '', name: '', qty: 1, moneyAmount: 0, schemeId: '', unit: '' }]
    });
  };

  const updatePremium = (index, field, value) => {
    const newPremiums = [...form.getPremiums];
    newPremiums[index] = { ...newPremiums[index], [field]: value };
    setForm({ ...form, getPremiums: newPremiums });
  };

  const removePremium = (index) => {
    const newPremiums = form.getPremiums.filter((_, i) => i !== index);
    setForm({ ...form, getPremiums: newPremiums });
  };

  const handlePhotoUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map(file => 
        uploadOrgPhoto(file, `sales/${form.projectId || 'temp'}`)
      );
      const urls = await Promise.all(uploadPromises);
      
      if (type === 'bill') {
        setForm({ ...form, billPhotos: [...form.billPhotos, ...urls] });
      } else {
        setForm({ ...form, photos: [...form.photos, ...urls] });
      }
      toast.success('Đã tải ảnh lên thành công!');
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (index, type) => {
    if (type === 'bill') {
      setForm({ ...form, billPhotos: form.billPhotos.filter((_, i) => i !== index) });
    } else {
      setForm({ ...form, photos: form.photos.filter((_, i) => i !== index) });
    }
  };

  const totalAmount = calculateTotalAmount(form.buyProducts);
  const totalQuantity = calculateTotalQuantity(form.buyProducts);

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bán hàng</h1>
          <p className="text-gray-600">Quản lý giao dịch bán hàng theo dự án</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Tổng giao dịch</p>
              <p className="text-xl font-semibold">{totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Tổng giá trị</p>
              <p className="text-xl font-semibold">{statsTotalAmount.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Giao dịch hôm nay</p>
              <p className="text-xl font-semibold">{todaySales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Hash className="w-5 h-5 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Người mua (unique)</p>
              <p className="text-xl font-semibold">{uniqueBuyers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Danh sách giao dịch</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Tìm kiếm theo ghi chú, mã OTP, người mua..." 
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                />
              </div>
              <button 
                onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm); }} 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm giao dịch bán hàng</span>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hình ảnh</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa điểm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dự án</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người mua</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã OTP</th>
                    <th className="w-24 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      {/* existing row cells remain the same, only padding updated to px-6 py-4 for consistency */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {item.billPhotos && item.billPhotos.length > 0 ? (
                            <div className="relative group">
                              <img 
                                src={item.billPhotos[0]} 
                                alt="Bill photo" 
                                className="w-12 h-12 object-cover rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => window.open(item.billPhotos[0], '_blank')}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center">
                                <Receipt className="w-6 h-6 text-gray-400" />
                              </div>
                              {item.billPhotos.length > 1 && (
                                <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  +{item.billPhotos.length - 1}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center">
                              <Receipt className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">
                            {locations.find(l => l.id === item.locationId)?.name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {projects.find(p => p.id === item.projectId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{item.buyerId || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{(item.buyProducts || []).length} sản phẩm</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{calculateTotalAmount(item.buyProducts).toLocaleString('vi-VN')}đ</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm">{formatDateTime(item.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{item.otpCode || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button 
                            onClick={() => setShowDetails(item)} 
                            className="p-2 hover:bg-gray-100 rounded"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
                      <td className="px-6 py-6 text-center text-gray-500" colSpan="9">
                        Không có giao dịch nào
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

      {/* Form tạo/sửa sale */}
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
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              {editing ? 'Cập nhật giao dịch bán hàng' : 'Thêm giao dịch bán hàng'}
            </h3>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Địa điểm *</label>
                  <select 
                    value={form.locationId} 
                    onChange={(e) => handleLocationChange(e.target.value)} 
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">-- Chọn địa điểm --</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ID Người mua</label>
                  <input 
                    value={form.buyerId} 
                    onChange={(e)=>setForm({...form, buyerId: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="Nhập ID người mua..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tên người mua</label>
                  <input 
                    value={form.buyerName} 
                    onChange={(e)=>setForm({...form, buyerName: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="Nhập tên người mua..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SĐT người mua</label>
                  <input 
                    value={form.buyerPhone} 
                    onChange={(e)=>setForm({...form, buyerPhone: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Session ID</label>
                  <input 
                    value={form.sessionId} 
                    onChange={(e)=>setForm({...form, sessionId: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="Nhập session ID..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mã OTP</label>
                  <input 
                    value={form.otpCode} 
                    onChange={(e)=>setForm({...form, otpCode: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="Nhập mã OTP..."
                  />
                </div>
              </div>

              {/* Buy Products */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Sản phẩm mua ({form.buyProducts.length})</label>
                  <button type="button" onClick={addProduct} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                    <Plus className="w-4 h-4 inline mr-1" />
                    Thêm sản phẩm
                  </button>
                </div>
                {form.buyProducts.map((product, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2 bg-white p-2 rounded">
                    <input 
                      placeholder="ID sản phẩm"
                      value={product.id || ''} 
                      onChange={(e) => updateProduct(index, 'id', e.target.value)}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                    />
                    <input 
                      placeholder="Tên sản phẩm"
                      value={product.name || ''} 
                      onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      className="col-span-3 border rounded px-2 py-1 text-sm"
                    />
                    <input 
                      type="number"
                      placeholder="SL"
                      value={product.qty || 0} 
                      onChange={(e) => updateProduct(index, 'qty', Number(e.target.value))}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                    />
                    <input 
                      type="number"
                      placeholder="Tiền"
                      value={product.moneyAmount || 0} 
                      onChange={(e) => updateProduct(index, 'moneyAmount', Number(e.target.value))}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                    />
                    <input 
                      placeholder="Đơn vị"
                      value={product.unit || ''} 
                      onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                    />
                    <button type="button" onClick={() => removeProduct(index)} className="col-span-1 text-red-600 hover:bg-red-50 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {form.buyProducts.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">Chưa có sản phẩm nào</p>
                )}
                <div className="mt-2 text-right">
                  <span className="text-sm font-medium">Tổng: {totalQuantity} sản phẩm - {totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Get Premiums */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Quà tặng/Khuyến mãi ({form.getPremiums.length})</label>
                  <button type="button" onClick={addPremium} className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                    <Plus className="w-4 h-4 inline mr-1" />
                    Thêm quà tặng
                  </button>
                </div>
                {form.getPremiums.map((premium, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2 bg-white p-2 rounded">
                    <input 
                      placeholder="ID"
                      value={premium.id || ''} 
                      onChange={(e) => updatePremium(index, 'id', e.target.value)}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                    />
                    <input 
                      placeholder="Tên quà tặng"
                      value={premium.name || ''} 
                      onChange={(e) => updatePremium(index, 'name', e.target.value)}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                    />
                    <input 
                      type="number"
                      placeholder="SL"
                      value={premium.qty || 0} 
                      onChange={(e) => updatePremium(index, 'qty', Number(e.target.value))}
                      className="col-span-1 border rounded px-2 py-1 text-sm"
                    />
                    <input 
                      type="number"
                      placeholder="Giá trị"
                      value={premium.moneyAmount || 0} 
                      onChange={(e) => updatePremium(index, 'moneyAmount', Number(e.target.value))}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                    />
                    <input 
                      placeholder="Scheme ID"
                      value={premium.schemeId || ''} 
                      onChange={(e) => updatePremium(index, 'schemeId', e.target.value)}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                    />
                    <input 
                      placeholder="Đơn vị"
                      value={premium.unit || ''} 
                      onChange={(e) => updatePremium(index, 'unit', e.target.value)}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                    />
                    <button type="button" onClick={() => removePremium(index)} className="col-span-1 text-red-600 hover:bg-red-50 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {form.getPremiums.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">Chưa có quà tặng nào</p>
                )}
              </div>

              {/* Bill Photos */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium mb-2">Hình ảnh hóa đơn</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.billPhotos.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`Bill ${index + 1}`} className="w-20 h-20 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index, 'bill')}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingPhotos ? 'Đang tải...' : 'Tải ảnh hóa đơn'}</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'bill')}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                </label>
              </div>

              {/* Photos */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium mb-2">Hình ảnh khác</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.photos.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`Photo ${index + 1}`} className="w-20 h-20 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index, 'photo')}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingPhotos ? 'Đang tải...' : 'Tải ảnh'}</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'photo')}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ghi chú</label>
                <textarea 
                  value={form.notes} 
                  onChange={(e)=>setForm({...form, notes: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  rows={3}
                  placeholder="Nhập ghi chú về giao dịch..."
                />
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

      {/* Modal xem chi tiết */}
      {showDetails && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetails(null);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Chi tiết giao dịch bán hàng
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Địa điểm:</label>
                  <p className="text-sm">{locations.find(l => l.id === showDetails.locationId)?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Dự án:</label>
                  <p className="text-sm">{projects.find(p => p.id === showDetails.projectId)?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Người mua:</label>
                  <p className="text-sm">{showDetails.buyerId || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Mã OTP:</label>
                  <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{showDetails.otpCode || '-'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Ghi chú:</label>
                <p className="text-sm">{showDetails.notes || '-'}</p>
              </div>

              {/* Buy Products */}
              {showDetails.buyProducts && showDetails.buyProducts.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Sản phẩm mua ({showDetails.buyProducts.length}):</label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Tên</th>
                          <th className="px-3 py-2 text-center">SL</th>
                          <th className="px-3 py-2 text-right">Tiền</th>
                          <th className="px-3 py-2 text-center">Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showDetails.buyProducts.map((product, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-3 py-2">{product.name}</td>
                            <td className="px-3 py-2 text-center">{product.qty}</td>
                            <td className="px-3 py-2 text-right">{(product.moneyAmount || 0).toLocaleString('vi-VN')}đ</td>
                            <td className="px-3 py-2 text-center">{product.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Get Premiums */}
              {showDetails.getPremiums && showDetails.getPremiums.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Quà tặng/Khuyến mãi ({showDetails.getPremiums.length}):</label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Tên</th>
                          <th className="px-3 py-2 text-center">SL</th>
                          <th className="px-3 py-2 text-left">Scheme ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showDetails.getPremiums.map((premium, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-3 py-2">{premium.name}</td>
                            <td className="px-3 py-2 text-center">{premium.qty}</td>
                            <td className="px-3 py-2">{premium.schemeId || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600">Tổng tiền:</label>
                <p className="text-lg font-semibold text-green-600">
                  {calculateTotalAmount(showDetails.buyProducts).toLocaleString('vi-VN')}đ
                </p>
                <p className="text-sm text-gray-500">Tổng số lượng: {calculateTotalQuantity(showDetails.buyProducts)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Thời gian tạo:</label>
                <p className="text-sm">{formatDateTime(showDetails.createdAt)}</p>
              </div>
              
              {showDetails.billPhotos && showDetails.billPhotos.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Hình ảnh hóa đơn:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {showDetails.billPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={photo} 
                          alt={`Bill photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(photo, '_blank')}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                          <Receipt className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-all">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowDetails(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
