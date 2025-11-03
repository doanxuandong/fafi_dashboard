import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Users, 
  Clock, 
  Package, 
  TrendingUp, 
  FileText, 
  Settings,
  Home,
  Folder,
  Building2,
  Calendar,
  ShoppingCart,
  Warehouse,
  Scale
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Tổ chức & Dự án', href: '/projects', icon: Folder },
  { name: 'Locations', href: '/locations', icon: Building2 },
  { name: 'Lịch làm việc', href: '/schedules', icon: Calendar },
  { name: 'Bán hàng', href: '/sales', icon: ShoppingCart },
  { name: 'Quản lý kho', href: '/stock-management', icon: Warehouse },
  { name: 'GPS Tracking', href: '/gps-tracking', icon: MapPin },
  { name: 'Quản lý nhân sự', href: '/staff-management', icon: Users },
  { name: 'Ca làm việc', href: '/shift-management', icon: Clock },
  { name: 'Hàng tồn & Giá bán', href: '/inventory', icon: Package },
  { name: 'Scheme bán hàng', href: '/sales-scheme', icon: TrendingUp },
  { name: 'Báo cáo & KPI', href: '/reports', icon: FileText },
  { name: 'Phân quyền', href: '/permissions', icon: Scale },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

// Admin can only see these 4 items
const adminNavigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Tổ chức & Dự án', href: '/projects', icon: Folder },
  { name: 'Locations', href: '/locations', icon: Building2 },
  { name: 'Lịch làm việc', href: '/schedules', icon: Calendar },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { userProfile } = useAuth();
  const userRole = userProfile?.role;
  
  // Filter navigation based on role
  const visibleNavigation = userRole === 'root' ? navigation : adminNavigation;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:top-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {visibleNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={clsx(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200',
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
