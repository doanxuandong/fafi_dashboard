import React, { useState } from 'react';
import { Clock, Users, MapPin, CheckCircle, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';

const mockShifts = [
  {
    id: 1,
    name: 'Ca sáng',
    time: '08:00 - 12:00',
    supervisor: 'Trần Thị B',
    store: 'Cửa hàng Hà Nội',
    checkPoints: [
      { id: 1, name: 'Kiểm tra hàng tồn', completed: true },
      { id: 2, name: 'Setup khu vực bán hàng', completed: true },
      { id: 3, name: 'Kiểm tra thiết bị', completed: false },
      { id: 4, name: 'Báo cáo tình hình', completed: false },
    ],
    status: 'in-progress',
    startTime: '08:00',
    endTime: '12:00',
  },
  {
    id: 2,
    name: 'Ca chiều',
    time: '13:00 - 17:00',
    supervisor: 'Nguyễn Văn A',
    store: 'Cửa hàng TP.HCM',
    checkPoints: [
      { id: 1, name: 'Kiểm tra hàng tồn', completed: false },
      { id: 2, name: 'Setup khu vực bán hàng', completed: false },
      { id: 3, name: 'Kiểm tra thiết bị', completed: false },
      { id: 4, name: 'Báo cáo tình hình', completed: false },
    ],
    status: 'pending',
    startTime: '13:00',
    endTime: '17:00',
  },
  {
    id: 3,
    name: 'Ca tối',
    time: '18:00 - 22:00',
    supervisor: 'Lê Văn C',
    store: 'Cửa hàng Đà Nẵng',
    checkPoints: [
      { id: 1, name: 'Kiểm tra hàng tồn', completed: true },
      { id: 2, name: 'Setup khu vực bán hàng', completed: true },
      { id: 3, name: 'Kiểm tra thiết bị', completed: true },
      { id: 4, name: 'Báo cáo tình hình', completed: true },
    ],
    status: 'completed',
    startTime: '18:00',
    endTime: '22:00',
  },
];

const mockSupervisors = [
  { id: 1, name: 'Trần Thị B', store: 'Cửa hàng Hà Nội', status: 'active' },
  { id: 2, name: 'Nguyễn Văn A', store: 'Cửa hàng TP.HCM', status: 'active' },
  { id: 3, name: 'Lê Văn C', store: 'Cửa hàng Đà Nẵng', status: 'active' },
];

export default function ShiftManagement() {
  const [selectedShift, setSelectedShift] = useState(null);
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredShifts = mockShifts.filter(shift => {
    if (filterStatus === 'all') return true;
    return shift.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in-progress': return 'Đang thực hiện';
      case 'pending': return 'Chờ bắt đầu';
      default: return 'Chưa xác định';
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý ca làm việc</h1>
          <p className="text-gray-600">Tạo và quản lý ca làm việc cho supervisor</p>
        </div>
        <button
          onClick={() => setShowCreateShift(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo ca mới</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng ca làm việc
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockShifts.length}
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
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ca hoàn thành
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockShifts.filter(s => s.status === 'completed').length}
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
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ca đang thực hiện
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockShifts.filter(s => s.status === 'in-progress').length}
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
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Supervisor
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockSupervisors.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shifts list */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Danh sách ca làm việc
                </h3>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ bắt đầu</option>
                  <option value="in-progress">Đang thực hiện</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedShift?.id === shift.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedShift(shift)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {shift.name}
                          </h4>
                          <p className="text-sm text-gray-500">{shift.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shift.status)}`}>
                          {getStatusText(shift.status)}
                        </span>
                        <div className="flex space-x-1">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{shift.supervisor}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{shift.store}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Shift details */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Chi tiết ca làm việc
              </h3>
              
              {selectedShift ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {selectedShift.name}
                    </h4>
                    <p className="text-sm text-gray-600">{selectedShift.time}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Supervisor: {selectedShift.supervisor}
                    </h5>
                    <p className="text-sm text-gray-600">{selectedShift.store}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-3">
                      Checklist trước ca
                    </h5>
                    <div className="space-y-2">
                      {selectedShift.checkPoints.map((point) => (
                        <div key={point.id} className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            point.completed ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {point.completed && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className={`text-sm ${
                            point.completed ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {point.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
                        Cập nhật trạng thái
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Chọn một ca làm việc để xem chi tiết
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Shift Modal */}
      {showCreateShift && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tạo ca làm việc mới
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên ca
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Ví dụ: Ca sáng"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ bắt đầu
                    </label>
                    <input
                      type="time"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ kết thúc
                    </label>
                    <input
                      type="time"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supervisor
                  </label>
                  <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option value="">Chọn supervisor</option>
                    {mockSupervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} - {supervisor.store}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cửa hàng
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Tên cửa hàng"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateShift(false)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setShowCreateShift(false)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tạo ca
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
