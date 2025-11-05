import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
  const { hasWebPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  useEffect(() => {
    let active = true;
    async function check() {
      setLoading(true);
      const ok = await hasWebPermission(resource, action, projectId, orgId);
      if (!active) return;
      setHasAccess(!!ok);
      setLoading(false);
    }
    check();
    return () => { active = false; };
  }, [resource, action, projectId, orgId, hasWebPermission]);
  
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

