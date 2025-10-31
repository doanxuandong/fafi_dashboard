import React, { useState } from 'react';
import { TrendingUp, Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

const mockSchemes = [
  {
    id: 1,
    name: 'Khuyến mãi Tết 2024',
    description: 'Giảm giá 20% cho tất cả sản phẩm bánh kẹo',
    type: 'discount',
    value: 20,
    startDate: '2024-01-20',
    endDate: '2024-02-20',
    stores: ['Cửa hàng Hà Nội', 'Cửa hàng TP.HCM', 'Cửa hàng Đà Nẵng'],
    products: ['Bánh Oreo Original', 'Kẹo Cadbury Dairy Milk'],
    status: 'active',
    target: 1000000,
    currentSales: 750000,
  },
  {
    id: 2,
    name: 'Combo gia đình',
    description: 'Mua 2 tặng 1 cho combo bánh quy',
    type: 'combo',
    value: 1,
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    stores: ['Cửa hàng Hà Nội'],
    products: ['Bánh Chips Ahoy', 'Bánh Oreo Original'],
    status: 'active',
    target: 500000,
    currentSales: 320000,
  },
  {
    id: 3,
    name: 'Khuyến mãi cuối tuần',
    description: 'Giảm giá 15% cho khách hàng VIP',
    type: 'vip_discount',
    value: 15,
    startDate: '2024-01-10',
    endDate: '2024-01-31',
    stores: ['Cửa hàng TP.HCM'],
    products: ['Tất cả sản phẩm'],
    status: 'inactive',
    target: 300000,
    currentSales: 180000,
  },
];

const mockProducts = [
  'Bánh Oreo Original',
  'Kẹo Cadbury Dairy Milk',
  'Bánh Chips Ahoy',
  'Bánh quy Ritz',
  'Kẹo Trident',
];

export default function SalesScheme() {
  const [activeTab, setActiveTab] = useState('schemes');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [showCreateScheme, setShowCreateScheme] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredSchemes = mockSchemes.filter(scheme => {
    if (filterStatus === 'all') return true;
    return scheme.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'inactive': return 'Tạm dừng';
      case 'expired': return 'Hết hạn';
      default: return 'Chưa xác định';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'discount': return 'Giảm giá %';
      case 'combo': return 'Combo';
      case 'vip_discount': return 'Giảm giá VIP';
      default: return 'Khác';
    }
  };

  const toggleSchemeStatus = (schemeId) => {
    // Toggle logic would go here
    console.log('Toggle scheme:', schemeId);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheme bán hàng</h1>
          <p className="text-gray-600">Quản lý các chương trình khuyến mãi và scheme bán hàng</p>
        </div>
        <button
          onClick={() => setShowCreateScheme(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo scheme mới</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng scheme
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockSchemes.length}
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
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang hoạt động
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockSchemes.filter(s => s.status === 'active').length}
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
                <TrendingUp className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tạm dừng
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockSchemes.filter(s => s.status === 'inactive').length}
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
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng doanh thu
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockSchemes.reduce((sum, s) => sum + s.currentSales, 0).toLocaleString('vi-VN')}đ
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
              onClick={() => setActiveTab('schemes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schemes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Danh sách scheme
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Phân tích hiệu quả
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'schemes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Danh sách scheme</h3>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredSchemes.map((scheme) => (
                  <div key={scheme.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{scheme.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scheme.status)}`}>
                            {getStatusText(scheme.status)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getTypeText(scheme.type)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{scheme.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Thời gian:</span>
                            <p className="font-medium">{scheme.startDate} - {scheme.endDate}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Cửa hàng:</span>
                            <p className="font-medium">{scheme.stores.length} cửa hàng</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Sản phẩm:</span>
                            <p className="font-medium">{scheme.products.length} sản phẩm</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Tiến độ doanh thu</span>
                            <span className="font-medium">
                              {scheme.currentSales.toLocaleString('vi-VN')}đ / {scheme.target.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(scheme.currentSales / scheme.target) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => toggleSchemeStatus(scheme.id)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          {scheme.status === 'active' ? (
                            <ToggleRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-indigo-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Phân tích hiệu quả scheme</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockSchemes.map((scheme) => (
                  <div key={scheme.id} className="border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">{scheme.name}</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Doanh thu đạt được</span>
                          <span className="font-medium">
                            {((scheme.currentSales / scheme.target) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(scheme.currentSales / scheme.target) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Mục tiêu:</span>
                          <p className="font-medium">{scheme.target.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Thực tế:</span>
                          <p className="font-medium">{scheme.currentSales.toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
                            Xem báo cáo chi tiết
                          </button>
                          <button className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Scheme Modal */}
      {showCreateScheme && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tạo scheme bán hàng mới
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên scheme
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Ví dụ: Khuyến mãi Tết 2024"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Mô tả chi tiết về scheme..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại scheme
                    </label>
                    <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      <option value="discount">Giảm giá %</option>
                      <option value="combo">Combo</option>
                      <option value="vip_discount">Giảm giá VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá trị
                    </label>
                    <input
                      type="number"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="20"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sản phẩm áp dụng
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {mockProducts.map((product) => (
                      <label key={product} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">{product}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mục tiêu doanh thu (VNĐ)
                  </label>
                  <input
                    type="number"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="1000000"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateScheme(false)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setShowCreateScheme(false)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tạo scheme
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
