import React, { useState, useEffect } from 'react';
import { Package, DollarSign, Plus, Edit, Trash2, Search, Pencil } from 'lucide-react';
// ✅ Clean Architecture: Sử dụng Custom Hooks
import { useProducts } from '../hooks/useProducts';
import { usePremiums } from '../hooks/usePremiums';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../contexts/AuthContext';

const mockStores = [
  { id: 1, name: 'Cửa hàng Hà Nội', address: '123 Đường ABC, Hà Nội' },
  { id: 2, name: 'Cửa hàng TP.HCM', address: '456 Đường XYZ, TP.HCM' },
  { id: 3, name: 'Cửa hàng Đà Nẵng', address: '789 Đường DEF, Đà Nẵng' },
];

const mockProducts = [
  {
    id: 1,
    name: 'Bánh Oreo Original',
    sku: 'ORE001',
    category: 'Bánh quy',
    currentStock: 150,
    minStock: 50,
    maxStock: 300,
    unitPrice: 25000,
    sellingPrice: 35000,
    store: 'Cửa hàng Hà Nội',
    lastUpdated: '2024-01-20',
    status: 'in-stock',
  },
  {
    id: 2,
    name: 'Kẹo Cadbury Dairy Milk',
    sku: 'CAD002',
    category: 'Kẹo sô cô la',
    currentStock: 80,
    minStock: 30,
    maxStock: 200,
    unitPrice: 15000,
    sellingPrice: 25000,
    store: 'Cửa hàng TP.HCM',
    lastUpdated: '2024-01-19',
    status: 'low-stock',
  },
  {
    id: 3,
    name: 'Bánh Chips Ahoy',
    sku: 'CHI003',
    category: 'Bánh quy',
    currentStock: 0,
    minStock: 20,
    maxStock: 150,
    unitPrice: 30000,
    sellingPrice: 45000,
    store: 'Cửa hàng Đà Nẵng',
    lastUpdated: '2024-01-18',
    status: 'out-of-stock',
  },
];

export default function Inventory() {
  const { currentUser, accessibleProjects } = useAuth();
  
  // ✅ Clean Architecture: Sử dụng Custom Hooks
  const {
    products,
    loading: productsLoading,
    createProduct: createProductHook,
    updateProduct: updateProductHook,
    deleteProduct: deleteProductHook,
    refresh: refreshProducts
  } = useProducts({ accessibleProjectIds: accessibleProjects });

  const {
    premiums,
    loading: premiumsLoading,
    createPremium: createPremiumHook,
    updatePremium: updatePremiumHook,
    deletePremium: deletePremiumHook,
    refresh: refreshPremiums
  } = usePremiums({ accessibleProjectIds: accessibleProjects });

  const {
    projects,
    loading: projectsLoading
  } = useProjects({ accessibleProjectIds: accessibleProjects });

  const [activeTab, setActiveTab] = useState('inventory');
  const [selectedStore, setSelectedStore] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddPremium, setShowAddPremium] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditingPremium, setIsEditingPremium] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', projectId: '', unitPrice: 0, pack: '', unit: '', available: true });

  // ✅ Clean Architecture: Sử dụng hook methods
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await createProductHook(form, currentUser);
      setShowAddProduct(false);
      setForm({ name: '', code: '', projectId: '', unitPrice: 0, pack: '', unit: '', available: true });
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in handleCreateProduct:', error);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await updateProductHook(editingProduct.id, form, currentUser);
      setShowEditProduct(false);
      setEditingProduct(null);
      setForm({ name: '', code: '', projectId: '', unitPrice: 0, pack: '', unit: '', available: true });
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in handleUpdateProduct:', error);
    }
  };

  const handleCreatePremium = async (e) => {
    e.preventDefault();
    try {
      await createPremiumHook(form, currentUser);
      setShowAddPremium(false);
      setForm({ name: '', code: '', projectId: '', unitPrice: 0, pack: '', unit: '', available: true });
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in handleCreatePremium:', error);
    }
  };

  const handleUpdatePremium = async (e) => {
    e.preventDefault();
    try {
      await updatePremiumHook(editingProduct.id, form, currentUser);
      setShowEditProduct(false);
      setEditingProduct(null);
      setIsEditingPremium(false);
      setForm({ name: '', code: '', projectId: '', unitPrice: 0, pack: '', unit: '', available: true });
      // ✅ Toast message đã được handle trong hook
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Error in handleUpdatePremium:', error);
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : projectId || 'N/A';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in-stock': return 'Còn hàng';
      case 'low-stock': return 'Sắp hết';
      case 'out-of-stock': return 'Hết hàng';
      default: return 'Chưa xác định';
    }
  };

  const totalValue = products.reduce((sum, product) => 
    sum + ((product.unitQty || 0) * (product.unitPrice || 0)), 0
  );

  const lowStockProducts = products.filter(p => !p.available);

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hàng tồn & Giá bán</h1>
          <p className="text-gray-600">Quản lý tồn kho và giá bán cho từng cửa hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng sản phẩm
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {products.length}
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
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng giá trị
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {totalValue.toLocaleString('vi-VN')}đ
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
                <Package className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Sắp hết hàng
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {lowStockProducts.length}
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
                <Package className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Hết hàng
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {products.filter(p => !p.available).length}
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
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quản lý tồn kho
            </button>
            <button
              onClick={() => setActiveTab('premiums')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'premiums'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quản lý quà tặng
            </button>
            <button
              onClick={() => setActiveTab('stores')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quản lý cửa hàng
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Danh sách sản phẩm</h3>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm sản phẩm</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tồn kho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá nhập
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đóng gói
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
                    {(productsLoading || premiumsLoading || projectsLoading) ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          Đang tải...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          Không có sản phẩm nào
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name || 'Chưa có tên'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Code: {product.code || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.unitQty || 0}
                            </div>
                            <div className="text-sm text-gray-500">
                              Sold: {product.soldUnitQty || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(product.unitPrice || 0).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.pack ? `${product.pack} packs` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getProjectName(product.projectId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {product.available ? 'Còn hàng' : 'Hết hàng'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingProduct(product);
                                  setForm({
                                    name: product.name || '',
                                    code: product.code || '',
                                    projectId: product.projectId || '',
                                    unitPrice: product.unitPrice || 0,
                                    pack: product.pack || '',
                                    unit: product.unit || '',
                                    available: product.available !== undefined ? product.available : true
                                  });
                                  setShowEditProduct(true);
                                }}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    // ✅ Clean Architecture: Sử dụng hook method (confirm đã handle trong hook)
                                    await deleteProductHook(product.id);
                                    // ✅ Toast message đã được handle trong hook
                                  } catch (error) {
                                    // Error đã được handle trong hook
                                    console.error('Error in deleteProduct:', error);
                                  }
                                }}
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

          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Quản lý giá bán</h3>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                  Cập nhật giá hàng loạt
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockStores.map((store) => (
                  <div key={store.id} className="border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">{store.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{store.address}</p>
                    
                    <div className="space-y-3">
                      {mockProducts.filter(p => p.store === store.name).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          </div>
                          <div className="text-right">
                            <input
                              type="number"
                              defaultValue={product.sellingPrice}
                              className="w-24 text-sm border border-gray-300 rounded px-2 py-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">VNĐ</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                      Lưu thay đổi
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'premiums' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Danh sách quà tặng</h3>
                <button
                  onClick={() => setShowAddPremium(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm quà tặng</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quà tặng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
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
                    {(productsLoading || premiumsLoading || projectsLoading) ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          Đang tải...
                        </td>
                      </tr>
                    ) : premiums.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          Không có quà tặng nào
                        </td>
                      </tr>
                    ) : (
                      premiums.map((premium) => (
                        <tr key={premium.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {premium.name || 'Chưa có tên'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {premium.code || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(premium.price || 0).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getProjectName(premium.projectId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${premium.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {premium.available ? 'Còn hàng' : 'Hết hàng'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingProduct(premium);
                                  setIsEditingPremium(true);
                                  setForm({
                                    name: premium.name || '',
                                    code: premium.code || '',
                                    projectId: premium.projectId || '',
                                    unitPrice: premium.price || 0,
                                    pack: premium.pack || '',
                                    unit: premium.unit || '',
                                    available: premium.available !== undefined ? premium.available : true
                                  });
                                  setShowEditProduct(true);
                                }}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    // ✅ Clean Architecture: Sử dụng hook method (confirm đã handle trong hook)
                                    await deletePremiumHook(premium.id);
                                    // ✅ Toast message đã được handle trong hook
                                  } catch (error) {
                                    // Error đã được handle trong hook
                                    console.error('Error in deletePremium:', error);
                                  }
                                }}
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

          {activeTab === 'stores' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Quản lý cửa hàng</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Thêm cửa hàng
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockStores.map((store) => (
                  <div key={store.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">{store.name}</h4>
                      <div className="flex space-x-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{store.address}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sản phẩm:</span>
                        <span className="font-medium">
                          {mockProducts.filter(p => p.store === store.name).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tổng giá trị:</span>
                        <span className="font-medium">
                          {mockProducts
                            .filter(p => p.store === store.name)
                            .reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0)
                            .toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddProduct || showEditProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingProduct ? (isEditingPremium ? 'Chỉnh sửa quà tặng' : 'Chỉnh sửa sản phẩm') : 'Thêm sản phẩm mới'}
            </h3>
            <form onSubmit={editingProduct ? (isEditingPremium ? handleUpdatePremium : handleUpdateProduct) : handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã sản phẩm *
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dự án
                </label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn dự án --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá đơn vị (VND)
                </label>
                <input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đóng gói
                </label>
                <input
                  type="text"
                  value={form.pack}
                  onChange={(e) => setForm({ ...form, pack: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: thùng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đơn vị
                </label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: chai, thùng"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="available" className="text-sm font-medium">
                  Sản phẩm đang có sẵn
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingProduct ? 'Cập nhật' : 'Tạo sản phẩm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(false);
                    setShowEditProduct(false);
                    setEditingProduct(null);
                    setForm({ name: '', code: '', projectId: '', unitPrice: 0, pack: '', unit: '', available: true });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Premium Modal */}
      {(showAddPremium || (showEditProduct && isEditingPremium)) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {isEditingPremium ? 'Chỉnh sửa quà tặng' : 'Thêm quà tặng mới'}
            </h3>
            <form onSubmit={isEditingPremium ? handleUpdatePremium : handleCreatePremium} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên quà tặng *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã quà tặng *</label>
                <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">-- Chọn dự án --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                <input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                <input type="number" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="mr-2" />
                <label className="text-sm font-medium">Quà tặng đang có sẵn</label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{isEditingPremium ? 'Cập nhật' : 'Tạo quà tặng'}</button>
                <button type="button" onClick={() => {setShowAddPremium(false); setShowEditProduct(false); setEditingProduct(null); setIsEditingPremium(false); setForm({ name: '', code: '', projectId: '', unitPrice: 0, pack: '', unit: '', available: true });}} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



