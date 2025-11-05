import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  Clock, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Calendar,
  Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
// ✅ Clean Architecture: Sử dụng Custom Hooks
import { useProjects } from '../hooks/useProjects';
import { useLocations } from '../hooks/useLocations';
import { useSales } from '../hooks/useSales';
// ❌ TODO: Các phần này vẫn import trực tiếp, sẽ refactor sau nếu cần
import { useSchedules } from '../hooks/useSchedules';
import { useStockAssets } from '../hooks/useStockAssets';
import { useStockBalances } from '../hooks/useStockBalances';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard() {
  const { currentUser, accessibleProjects } = useAuth();
  // ✅ Clean Architecture: Sử dụng Custom Hooks
  const { projects, loading: projectsLoading } = useProjects({ accessibleProjectIds: accessibleProjects });
  const { locations, loading: locationsLoading } = useLocations({ accessibleProjectIds: accessibleProjects });
  const { sales, loading: salesLoading } = useSales({ accessibleProjectIds: accessibleProjects });
  const { schedules, loading: schedulesLoading } = useSchedules({ accessibleProjectIds: accessibleProjects });
  const { assets, loading: assetsLoading } = useStockAssets({ accessibleProjectIds: accessibleProjects });
  const { balances, loading: balancesLoading } = useStockBalances({ accessibleProjectIds: accessibleProjects });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalLocations: 0,
    todaySchedules: 0,
    totalSales: 0,
    lowStockItems: 0,
    totalAssets: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]); // last 7 days amounts
  const [locationsByProject, setLocationsByProject] = useState([]); // [{name,count}]
  const [stockDonut, setStockDonut] = useState({ ok: 0, low: 0 });

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
    if (isNaN(date.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // ✅ Tất cả data đã được load tự động bởi hooks và đã được filter theo accessibleProjects
      const scopedLocations = locations; // ✅ Đã được filter trong hook
      const scopedSchedules = schedules; // ✅ Đã được filter trong hook
      const scopedSales = sales; // ✅ Đã được filter trong hook
      const scopedAssets = assets; // ✅ Đã được filter trong hook
      const scopedBalances = balances; // ✅ Đã được filter trong hook

      // Tính toán thống kê
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySchedules = scopedSchedules.filter(schedule => {
        if (!schedule.startAt) return false;
        let startDate;
        if (schedule.startAt.seconds) {
          startDate = new Date(schedule.startAt.seconds * 1000);
        } else if (schedule.startAt.toDate) {
          startDate = schedule.startAt.toDate();
        } else {
          return false;
        }
        return startDate >= today;
      });

      const lowStockItems = scopedBalances.filter(balance => 
        balance.unitQty < 10
      ).length;

      setStats({
        totalProjects: projects.length, // ✅ Lấy từ hook
        totalLocations: scopedLocations.length,
        todaySchedules: todaySchedules.length,
        totalSales: scopedSales.length,
        lowStockItems,
        totalAssets: scopedAssets.length
      });

      // Tạo hoạt động gần đây từ dữ liệu thực
      const activities = [];
      
      // Thêm hoạt động từ schedules
      scopedSchedules.slice(0, 2).forEach(schedule => {
        activities.push({
          id: `schedule-${schedule.id}`,
          type: 'info',
          message: `Lịch làm việc: ${schedule.locationName || 'Chưa có tên địa điểm'}`,
          time: formatDateTime(schedule.createdAt),
          icon: Calendar,
        });
      });

      // Thêm hoạt động từ sales
      scopedSales.slice(0, 2).forEach(sale => {
        activities.push({
          id: `sale-${sale.id}`,
          type: 'success',
          message: `Giao dịch bán hàng mới tại ${sale.locationName || 'Chưa có tên địa điểm'}`,
          time: formatDateTime(sale.createdAt),
          icon: ShoppingCart,
        });
      });

      // Thêm hoạt động từ assets
      scopedAssets.slice(0, 1).forEach(asset => {
        activities.push({
          id: `asset-${asset.id}`,
          type: 'info',
          message: `Thêm tài sản mới: ${asset.name}`,
          time: formatDateTime(asset.createdAt),
          icon: Package,
        });
      });

      // Sắp xếp theo thời gian tạo
      activities.sort((a, b) => {
        const timeA = a.time.includes('phút') ? 0 : a.time.includes('giờ') ? 1 : 2;
        const timeB = b.time.includes('phút') ? 0 : b.time.includes('giờ') ? 1 : 2;
        return timeA - timeB;
      });

      setRecentActivities(activities.slice(0, 4));

      // Build charts data
      // Sales trend 7 days
      const dayKey = (d) => {
        const dt = new Date(d); dt.setHours(0,0,0,0); return dt.toISOString().slice(0,10);
      };
      const today2 = new Date(); today2.setHours(0,0,0,0);
      const last7 = Array.from({length:7},(_,i)=>{
        const d = new Date(today2); d.setDate(d.getDate()-(6-i)); return d;
      });
      const byDay = new Map(last7.map(d=>[dayKey(d),0]));
      const totalAmount = (buyProducts=[]) => (buyProducts||[]).reduce((s,p)=> s + (Number(p.unitPrice||0)*Number(p.unitQty||0)),0);
      (scopedSales||[]).forEach(sale=>{
        let d; if (sale.createdAt?.seconds) d = new Date(sale.createdAt.seconds*1000); else if (sale.createdAt?.toDate) d = sale.createdAt.toDate(); else if (sale.createdAt) d = new Date(sale.createdAt); else d = null;
        if (!d) return; const k = dayKey(d); if (byDay.has(k)) byDay.set(k, byDay.get(k)+ totalAmount(sale.buyProducts));
      });
      setSalesTrend(last7.map(d=>({ label: d.getDate(), value: byDay.get(dayKey(d))||0 })));

      // Locations by project (top 5)
      const projCount = new Map();
      (scopedLocations||[]).forEach(l=>{ if (!l.projectId) return; projCount.set(l.projectId, (projCount.get(l.projectId)||0)+1); });
      const nameById = new Map(projects.map(p=>[p.id, p.name])); // ✅ Lấy từ hook
      const locByProjArr = Array.from(projCount.entries()).map(([id,c])=>({ name: nameById.get(id)||'Khác', count:c }))
        .sort((a,b)=>b.count-a.count).slice(0,5);
      setLocationsByProject(locByProjArr);

      // Stock donut
      const low = (scopedBalances||[]).filter(b => Number(b.unitQty) < 10).length;
      const ok = (scopedBalances||[]).length - low;
      setStockDonut({ ok: Math.max(ok,0), low: Math.max(low,0) });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [accessibleProjects, projects, locations, sales, schedules, assets, balances]); // ✅ Reload khi data thay đổi

  const statsData = [
    {
      name: 'Tổng dự án',
      value: stats.totalProjects.toString(),
      change: '+0',
      changeType: 'neutral',
      icon: Building2,
    },
    {
      name: 'Tổng địa điểm',
      value: stats.totalLocations.toString(),
      change: '+0',
      changeType: 'neutral',
      icon: MapPin,
    },
    {
      name: 'Lịch làm việc hôm nay',
      value: stats.todaySchedules.toString(),
      change: '+0',
      changeType: 'neutral',
      icon: Clock,
    },
    {
      name: 'Sản phẩm sắp hết',
      value: stats.lowStockItems.toString(),
      change: '+0',
      changeType: stats.lowStockItems > 0 ? 'negative' : 'positive',
      icon: Package,
    },
  ];

  if (loading || projectsLoading || locationsLoading || salesLoading || schedulesLoading || assetsLoading || balancesLoading) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Tổng quan hệ thống quản lý</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Tổng quan hệ thống quản lý Mondelez</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' :
                        stat.changeType === 'negative' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activities & top chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent activities (narrow left) */}
        <div className="bg-white shadow rounded-lg lg:col-span-1">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Hoạt động gần đây</h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivities.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                              activity.type === 'success' ? 'bg-green-100 text-green-600' :
                              activity.type === 'error' ? 'bg-red-100 text-red-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <activity.icon className="h-4 w-4" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">{activity.message}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">{activity.time}</div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li>
                    <div className="text-center py-8 text-gray-500"><p>Chưa có hoạt động nào</p></div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Sales trend line chart */}
        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Doanh thu 7 ngày gần nhất</h3>
            <MiniLineChart data={salesTrend} height={180} />
          </div>
        </div>
      </div>

      {/* Bottom charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Địa điểm theo dự án (Top 5)</h3>
            <MiniBarChart data={locationsByProject} height={200} />
          </div>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Tồn kho theo trạng thái</h3>
            <MiniDonutChart ok={stockDonut.ok} low={stockDonut.low} />
          </div>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Giao dịch hôm nay</h3>
            <p className="text-3xl font-semibold">{stats.totalSales}</p>
            <p className="text-gray-500 text-sm">Tổng số giao dịch trong phạm vi dự án của bạn</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple SVG line chart
function MiniLineChart({ data = [], height = 160 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v)=>`${v.toLocaleString('vi-VN')}`} />
          <Tooltip formatter={(v)=>[v.toLocaleString('vi-VN')+'đ','Doanh thu']} />
          <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Simple SVG bar chart
function MiniBarChart({ data = [], height = 180 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Simple SVG donut chart
function MiniDonutChart({ ok = 0, low = 0, size = 180 }) {
  const data = [
    { name: 'OK', value: ok, color: '#3b82f6' },
    { name: 'Sắp hết', value: low, color: '#f59e0b' },
  ];
  return (
    <div style={{ width: '100%', height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend verticalAlign="middle" align="right" layout="vertical" />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
