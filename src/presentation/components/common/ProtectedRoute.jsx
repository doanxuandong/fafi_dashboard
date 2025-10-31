import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isAdminAppUser, authLoading, userProfile } = useAuth();
  if (authLoading) return <div className="p-6 text-center text-gray-500">Đang kiểm tra quyền truy cập...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!userProfile) return <div className="p-6 text-center text-gray-500">Đang tải thông tin người dùng...</div>;
  if (!isAdminAppUser) return <Navigate to="/no-access" replace />;
  return children;
};

export default ProtectedRoute;
