import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requiredResource = null, requiredAction = 'read', projectId = null, orgId = null }) => {
  const { currentUser, isAdminAppUser, authLoading, userProfile, hasWebPermission } = useAuth();
  const [routeAllowed, setRouteAllowed] = useState(true);
  const [checking, setChecking] = useState(false);

  // Always register hooks before any early return
  useEffect(() => {
    let active = true;
    async function check() {
      if (!requiredResource) {
        setRouteAllowed(true);
        return;
      }
      setChecking(true);
      const ok = await hasWebPermission(requiredResource, requiredAction, projectId, orgId);
      if (!active) return;
      setRouteAllowed(!!ok);
      setChecking(false);
    }
    check();
    return () => { active = false; };
  }, [requiredResource, requiredAction, projectId, orgId, hasWebPermission]);

  // Now perform early-return checks AFTER hooks are declared
  if (authLoading) return <div className="p-6 text-center text-gray-500">Đang kiểm tra quyền truy cập...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!userProfile) return <div className="p-6 text-center text-gray-500">Đang tải thông tin người dùng...</div>;
  if (!isAdminAppUser) return <Navigate to="/no-access" replace />;
  if (checking) return <div className="p-6 text-center text-gray-500">Đang kiểm tra quyền truy cập...</div>;
  if (!routeAllowed) return <Navigate to="/no-access" replace />;
  return children;
};

export default ProtectedRoute;
