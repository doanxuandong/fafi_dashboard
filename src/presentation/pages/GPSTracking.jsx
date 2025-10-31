import React, { useState } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';

const mockStaff = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    position: 'Nhân viên bán hàng',
    currentLocation: 'Cửa hàng Hà Nội',
    status: 'working',
    lastCheckIn: '09:00',
    distanceFromWork: 0,
    isInRange: true,
  },
  {
    id: 2,
    name: 'Trần Thị B',
    position: 'Supervisor',
    currentLocation: 'Cửa hàng TP.HCM',
    status: 'working',
    lastCheckIn: '08:30',
    distanceFromWork: 250,
    isInRange: false,
  },
  {
    id: 3,
    name: 'Lê Văn C',
    position: 'Nhân viên bán hàng',
    currentLocation: 'Cửa hàng Đà Nẵng',
    status: 'break',
    lastCheckIn: '10:15',
    distanceFromWork: 50,
    isInRange: true,
  },
];

const mockAlerts = [
  {
    id: 1,
    staffName: 'Trần Thị B',
    message: 'Rời khỏi vị trí làm việc 250m',
    time: '10:30',
    severity: 'high',
    location: 'Cửa hàng TP.HCM',
  },
  {
    id: 2,
    staffName: 'Phạm Văn D',
    message: 'Rời khỏi vị trí làm việc 180m',
    time: '09:45',
    severity: 'medium',
    location: 'Cửa hàng Hải Phòng',
  },
];

export default function GPSTracking() {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredStaff = mockStaff.filter(staff => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'in-range') return staff.isInRange;
    if (filterStatus === 'out-of-range') return !staff.isInRange;
    return staff.status === filterStatus;
  });

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GPS Tracking</h1>
        <p className="text-gray-600">Theo dõi vị trí nhân viên và cảnh báo rời khỏi khu vực làm việc</p>
      </div>

      {/* Stats cards */}
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
                    {mockStaff.length}
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
                    Trong khu vực
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockStaff.filter(s => s.isInRange).length}
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
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Cảnh báo
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockAlerts.length}
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
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang nghỉ
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockStaff.filter(s => s.status === 'break').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff location list */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Vị trí nhân viên
              </h3>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="in-range">Trong khu vực</option>
                <option value="out-of-range">Ngoài khu vực</option>
                <option value="working">Đang làm việc</option>
                <option value="break">Nghỉ giải lao</option>
              </select>
            </div>
            
            <div className="space-y-3">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStaff?.id === staff.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStaff(staff)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        staff.isInRange ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {staff.name}
                        </p>
                        <p className="text-xs text-gray-500">{staff.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {staff.distanceFromWork}m từ vị trí
                      </p>
                      <p className="text-xs text-gray-500">
                        Check-in: {staff.lastCheckIn}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{staff.currentLocation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Cảnh báo GPS
            </h3>
            
            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border-l-4 rounded-r-lg ${
                    alert.severity === 'high'
                      ? 'border-red-500 bg-red-50'
                      : 'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.staffName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {alert.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{alert.time}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        alert.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.severity === 'high' ? 'Cao' : 'Trung bình'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Cài đặt GPS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng cách cảnh báo (mét)
              </label>
              <input
                type="number"
                defaultValue="200"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tần suất cập nhật vị trí (giây)
              </label>
              <input
                type="number"
                defaultValue="30"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Lưu cài đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
