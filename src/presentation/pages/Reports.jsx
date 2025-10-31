import React, { useState } from 'react';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Calendar
} from 'lucide-react';

const mockReports = [
  {
    id: 1,
    title: 'Báo cáo KPI tháng 1/2024',
    type: 'kpi',
    period: '2024-01-01 to 2024-01-31',
    status: 'completed',
    generatedBy: 'Admin',
    generatedAt: '2024-01-31 23:59:00',
    summary: {
      totalStaff: 25,
      avgPerformance: 85.5,
      targetAchieved: 92.3,
      issues: 3,
    },
  },
  {
    id: 2,
    title: 'Báo cáo doanh thu tuần 4',
    type: 'revenue',
    period: '2024-01-22 to 2024-01-28',
    status: 'completed',
    generatedBy: 'System',
    generatedAt: '2024-01-28 23:59:00',
    summary: {
      totalRevenue: 15000000,
      targetRevenue: 12000000,
      growth: 25.0,
      topStore: 'Cửa hàng TP.HCM',
    },
  },
  {
    id: 3,
    title: 'Báo cáo GPS tracking',
    type: 'gps',
    period: '2024-01-20 to 2024-01-27',
    status: 'pending',
    generatedBy: 'Admin',
    generatedAt: null,
    summary: null,
  },
];

const mockKPI = [
  {
    id: 1,
    staffName: 'Nguyễn Văn A',
    store: 'Cửa hàng Hà Nội',
    position: 'Nhân viên bán hàng',
    salesTarget: 5000000,
    actualSales: 4800000,
    performance: 96.0,
    attendance: 100,
    trainingScore: 88,
    overallScore: 94.7,
    status: 'excellent',
  },
  {
    id: 2,
    staffName: 'Trần Thị B',
    store: 'Cửa hàng TP.HCM',
    position: 'Supervisor',
    salesTarget: 8000000,
    actualSales: 7200000,
    performance: 90.0,
    attendance: 95,
    trainingScore: 92,
    overallScore: 92.3,
    status: 'good',
  },
  {
    id: 3,
    staffName: 'Lê Văn C',
    store: 'Cửa hàng Đà Nẵng',
    position: 'Nhân viên bán hàng',
    salesTarget: 4000000,
    actualSales: 3200000,
    performance: 80.0,
    attendance: 85,
    trainingScore: 75,
    overallScore: 80.0,
    status: 'needs_improvement',
  },
];

const mockAlerts = [
  {
    id: 1,
    type: 'kpi_warning',
    title: 'Nhân viên không đạt KPI',
    message: 'Lê Văn C có điểm KPI dưới 80% trong tháng 1',
    staffName: 'Lê Văn C',
    store: 'Cửa hàng Đà Nẵng',
    severity: 'high',
    createdAt: '2024-01-30 14:30:00',
    status: 'unresolved',
  },
  {
    id: 2,
    type: 'gps_alert',
    title: 'Rời khỏi vị trí làm việc',
    message: 'Trần Thị B rời khỏi vị trí làm việc 250m',
    staffName: 'Trần Thị B',
    store: 'Cửa hàng TP.HCM',
    severity: 'medium',
    createdAt: '2024-01-30 10:15:00',
    status: 'resolved',
  },
  {
    id: 3,
    type: 'training_overdue',
    title: 'Training quá hạn',
    message: 'Phạm Văn D chưa hoàn thành training module 3',
    staffName: 'Phạm Văn D',
    store: 'Cửa hàng Hà Nội',
    severity: 'low',
    createdAt: '2024-01-29 16:45:00',
    status: 'unresolved',
  },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('reports');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs_improvement': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'unresolved': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ xử lý';
      case 'failed': return 'Thất bại';
      case 'excellent': return 'Xuất sắc';
      case 'good': return 'Tốt';
      case 'needs_improvement': return 'Cần cải thiện';
      case 'resolved': return 'Đã xử lý';
      case 'unresolved': return 'Chưa xử lý';
      default: return 'Chưa xác định';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Chưa xác định';
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo & KPI</h1>
          <p className="text-gray-600">Xử lý báo cáo và theo dõi KPI nhân viên</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Xuất báo cáo</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Tạo báo cáo mới</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng báo cáo
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockReports.length}
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
                    Báo cáo hoàn thành
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockReports.filter(r => r.status === 'completed').length}
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
                    Cảnh báo chưa xử lý
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockAlerts.filter(a => a.status === 'unresolved').length}
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
                    KPI trung bình
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {mockKPI.reduce((sum, k) => sum + k.overallScore, 0) / mockKPI.length}%
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
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Báo cáo
            </button>
            <button
              onClick={() => setActiveTab('kpi')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'kpi'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              KPI nhân viên
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cảnh báo & Xử lý
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Danh sách báo cáo</h3>
                <div className="flex space-x-2">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="week">Tuần này</option>
                    <option value="month">Tháng này</option>
                    <option value="quarter">Quý này</option>
                    <option value="year">Năm này</option>
                  </select>
                  <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-1">
                    <Filter className="w-4 h-4" />
                    <span>Lọc</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {mockReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{report.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {getStatusText(report.status)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {report.type.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">Thời gian: {report.period}</p>
                        
                        {report.summary && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {report.type === 'kpi' && (
                              <>
                                <div>
                                  <span className="text-gray-500">Tổng nhân viên:</span>
                                  <p className="font-medium">{report.summary.totalStaff}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">KPI trung bình:</span>
                                  <p className="font-medium">{report.summary.avgPerformance}%</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Đạt mục tiêu:</span>
                                  <p className="font-medium">{report.summary.targetAchieved}%</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Vấn đề:</span>
                                  <p className="font-medium">{report.summary.issues}</p>
                                </div>
                              </>
                            )}
                            {report.type === 'revenue' && (
                              <>
                                <div>
                                  <span className="text-gray-500">Doanh thu:</span>
                                  <p className="font-medium">{report.summary.totalRevenue.toLocaleString('vi-VN')}đ</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Mục tiêu:</span>
                                  <p className="font-medium">{report.summary.targetRevenue.toLocaleString('vi-VN')}đ</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Tăng trưởng:</span>
                                  <p className="font-medium text-green-600">+{report.summary.growth}%</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Cửa hàng top:</span>
                                  <p className="font-medium">{report.summary.topStore}</p>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-4 text-sm text-gray-500">
                          Tạo bởi: {report.generatedBy} | {report.generatedAt ? `Lúc: ${report.generatedAt}` : 'Đang xử lý...'}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-blue-600">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-indigo-600">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'kpi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">KPI nhân viên</h3>
                <div className="flex space-x-2">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="month">Tháng này</option>
                    <option value="quarter">Quý này</option>
                    <option value="year">Năm này</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doanh số
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chuyên cần
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Training
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng điểm
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
                    {mockKPI.map((kpi) => (
                      <tr key={kpi.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {kpi.staffName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {kpi.position} - {kpi.store}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {kpi.actualSales.toLocaleString('vi-VN')}đ
                          </div>
                          <div className="text-sm text-gray-500">
                            Mục tiêu: {kpi.salesTarget.toLocaleString('vi-VN')}đ
                          </div>
                          <div className="text-sm text-gray-500">
                            Đạt: {kpi.performance}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {kpi.attendance}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {kpi.trainingScore}/100
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {kpi.overallScore}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(kpi.status)}`}>
                            {getStatusText(kpi.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Cảnh báo & Xử lý</h3>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="unresolved">Chưa xử lý</option>
                  <option value="resolved">Đã xử lý</option>
                </select>
              </div>

              <div className="space-y-4">
                {mockAlerts.map((alert) => (
                  <div key={alert.id} className={`border rounded-lg p-6 ${
                    alert.status === 'unresolved' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{alert.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {getSeverityText(alert.severity)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                            {getStatusText(alert.status)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{alert.message}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Nhân viên:</span>
                            <p className="font-medium">{alert.staffName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Cửa hàng:</span>
                            <p className="font-medium">{alert.store}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Thời gian:</span>
                            <p className="font-medium">{alert.createdAt}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {alert.status === 'unresolved' && (
                          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm">
                            Xử lý
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-blue-600">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
