import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './presentation/contexts/AuthContext';
import ProtectedRoute from './presentation/components/common/ProtectedRoute';
import Layout from './presentation/components/layout/Layout';
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
            <Route path="projects" element={<Projects />} />
            <Route path="locations" element={<Locations />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="sales" element={<Sales />} />
            <Route path="stock-management" element={<StockManagement />} />
            <Route path="gps-tracking" element={<GPSTracking />} />
            <Route path="staff-management" element={<StaffManagement />} />
            <Route path="shift-management" element={<ShiftManagement />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="sales-scheme" element={<SalesScheme />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="permissions" element={<Permissions />} />
          </Route>
          
          {/* 404 - not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App

