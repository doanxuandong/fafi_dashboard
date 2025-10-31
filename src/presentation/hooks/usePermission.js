import { useState, useEffect } from 'react';
import { hasPermission } from '../../infrastructure/services/permissionService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to check user permissions
 * Usage: const { hasAccess, loading } = usePermission({ resource, action, projectId });
 */
export function usePermission({ resource, action, projectId = null, orgId = null }) {
  const { currentUser } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkAccess() {
      if (!currentUser) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      
      try {
        // TODO: Get actual orgId from context
        const result = await hasPermission({
          userId: currentUser.uid,
          orgId: orgId || 'default',
          projectId,
          resource,
          action,
        });
        setHasAccess(result);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [currentUser, resource, action, projectId, orgId]);
  
  return { hasAccess, loading };
}

/**
 * Hook to check multiple permissions
 */
export function usePermissions({ resources = [], projectId = null, orgId = null }) {
  const { currentUser } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkPermissions() {
      if (!currentUser) {
        setPermissions({});
        setLoading(false);
        return;
      }
      
      const results = {};
      for (const { resource, action } of resources) {
        try {
          // TODO: Get actual orgId from context
          results[`${resource}_${action}`] = await hasPermission({
            userId: currentUser.uid,
            orgId: orgId || 'default',
            projectId,
            resource,
            action,
          });
        } catch (error) {
          console.error('Error checking permission:', error);
          results[`${resource}_${action}`] = false;
        }
      }
      
      setPermissions(results);
      setLoading(false);
    }
    
    checkPermissions();
  }, [currentUser, resources, projectId, orgId]);
  
  return { permissions, loading };
}

