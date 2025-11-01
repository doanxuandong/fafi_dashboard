import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../../infrastructure/services/firebase';
import { getUserById } from '../../infrastructure/repositories/usersRepository';
import { hasPermission as checkAclPermission } from '../../infrastructure/services/permissionService';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [accessibleProjects, setAccessibleProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  // Check if current user has permission
  const hasPermission = async (resource, action, projectId = null, orgId = null) => {
    if (!currentUser) return false;
    try {
      return await checkAclPermission({
        userId: currentUser.uid,
        orgId: orgId || userProfile?.lastOrgId || (userProfile?.orgIds || [])[0] || null,
        projectId,
        resource,
        action,
      });
    } catch (e) {
      console.error('ACL hasPermission error:', e);
      return false;
    }
  };

  // Check if current user is root
  const isRoot = async () => {
    if (!currentUser) return false;
    const email = currentUser.email || '';
    return email === 'root@fafi.app' || userProfile?.role === 'root';
  };

  // Get if user has access to all projects
  const hasAccessToAllProjects = () => {
    return accessibleProjects === '*';
  };

  // Only users with role 'root' or 'admin' can access Admin app
  const isAdminAppUser = !!(userProfile && (userProfile.role === 'root' || userProfile.role === 'admin'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setCurrentUser(user);
          
          // Lấy thông tin user profile từ Firestore
          const profile = await getUserById(user.uid);
          
          // Nếu không có profile trong Firestore, không cho phép truy cập
          if (!profile) {
            console.error('User profile not found in Firestore');
            setUserProfile(null);
            setCurrentUser(null);
            setAccessibleProjects([]);
            setLoading(false);
            return;
          }
          
          setUserProfile(profile);
          
          // Xác định tập projects có thể truy cập: root => '*', khác => dựa vào assignments
          if (profile?.role === 'root' || (user.email || '') === 'root@fafi.app') {
            setAccessibleProjects('*');
          } else {
            setAccessibleProjects(profile?.projectIds || []);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile(null);
          setCurrentUser(null);
          setAccessibleProjects([]);
        }
      } else {
        setUserProfile(null);
        setCurrentUser(null);
        setAccessibleProjects([]);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    accessibleProjects,
    isAdminAppUser,
    authLoading: loading,
    hasPermission,
    isRoot,
    hasAccessToAllProjects,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
