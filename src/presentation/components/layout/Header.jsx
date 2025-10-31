import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import fafiLogo from '../../../assets/fafi_logo.png';
import NotificationDropdown from '../common/NotificationDropdown';

export default function Header({ onMenuClick }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 w-full">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center ml-2 lg:ml-0">
            <img 
              src={fafiLogo} 
              alt="FaFiTrade Logo" 
              className="h-8 w-8 object-contain mr-3"
            />
            <h2 className="text-lg font-semibold text-gray-900">
              FaFiTrade Admin
            </h2>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <NotificationDropdown />
          
          {/* User menu */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {currentUser?.email || 'Admin'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
