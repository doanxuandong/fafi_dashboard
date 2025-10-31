import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { NotificationProvider } from '../../contexts/NotificationContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Navbar - Full width at top */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Left side below navbar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Main content - Right side */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
