import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './presentation/contexts/AuthContext';
import ProtectedRoute from './presentation/components/common/ProtectedRoute';
import Layout from './presentation/components/layout/Layout';
import { Toaster } from './presentation/components/common/Toaster';
import { ConfirmDialog } from './presentation/components/common/ConfirmDialog';
import Projects from './presentation/pages/Projects';
import Locations from './presentation/pages/Locations';
import Schedules from './presentation/pages/Schedules';
import Sales from './presentation/pages/Sales';
import StockManagement from './presentation/pages/StockManagement';
import Login from './presentation/pages/Login';
import Dashboard from './presentation/pages/Dashboard';
import GPSTracking from './presentation/pages/GPSTracking';
import StaffManagement from './presentation/pages/StaffManagement';
import ShiftManagement from './presentation/pages/ShiftManagement';
import Inventory from './presentation/pages/Inventory';
import SalesScheme from './presentation/pages/SalesScheme';
import Reports from './presentation/pages/Reports';
import Settings from './presentation/pages/Settings';
import Permissions from './presentation/pages/Permissions';
import NoAccess from './presentation/pages/NoAccess';
import NotFound from './presentation/pages/NotFound';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          <Route path="/no-access" element={<NoAccess />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProtectedRoute requiredResource="project"><Projects /></ProtectedRoute>} />
            <Route path="locations" element={<ProtectedRoute requiredResource="location"><Locations /></ProtectedRoute>} />
            <Route path="schedules" element={<ProtectedRoute requiredResource="schedule"><Schedules /></ProtectedRoute>} />
            <Route path="sales" element={<ProtectedRoute requiredResource="sale"><Sales /></ProtectedRoute>} />
            <Route path="stock-management" element={<ProtectedRoute requiredResource="stock"><StockManagement /></ProtectedRoute>} />
            <Route path="gps-tracking" element={<GPSTracking />} />
            <Route path="staff-management" element={<ProtectedRoute requiredResource="staff"><StaffManagement /></ProtectedRoute>} />
            <Route path="shift-management" element={<ShiftManagement />} />
            <Route path="inventory" element={<ProtectedRoute requiredResource="inventory"><Inventory /></ProtectedRoute>} />
            <Route path="sales-scheme" element={<SalesScheme />} />
            <Route path="reports" element={<ProtectedRoute requiredResource="report"><Reports /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute requiredResource="settings"><Settings /></ProtectedRoute>} />
            <Route path="permissions" element={<ProtectedRoute requiredResource="permissions"><Permissions /></ProtectedRoute>} />
          </Route>
          
          {/* 404 - not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <ConfirmDialog />
      </Router>
    </AuthProvider>
  );
}

export default App

