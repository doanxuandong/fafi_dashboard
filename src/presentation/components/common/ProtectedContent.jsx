import React from 'react';
import { usePermission } from '../../hooks/usePermission';

/**
 * Component to protect content based on permissions
 * Usage: 
 * <ProtectedContent resource="project" action="create">
 *   <button>Add Project</button>
 * </ProtectedContent>
 */
export default function ProtectedContent({ 
  children, 
  resource, 
  action, 
  projectId = null,
  orgId = null,
  fallback = null,
  hide = false 
}) {
  const { hasAccess, loading } = usePermission({ resource, action, projectId, orgId });
  
  if (loading) {
    return null;
  }
  
  if (!hasAccess) {
    if (hide) {
      return null;
    }
    return fallback;
  }
  
  return <>{children}</>;
}

