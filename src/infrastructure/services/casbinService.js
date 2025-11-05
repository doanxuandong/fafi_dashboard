import { getUserById } from '../repositories/usersRepository';

/**
 * Simple RBAC permission checker
 * Không cần Casbin phức tạp, chỉ check permission theo role và project
 */

/**
 * Role-based permissions
 * Format: { role: { resource: { action: boolean } } }
 */
const rolePermissions = {
  'root': {
    '*': { '*': true } 
  },
  'owner': {
    '*': { '*': true } 
  },
  'client': {
    '*': { 'read': true }, 
    'report': { 'create': true, 'read': true, 'edit': true }
  },
  'admin': {
    '*': { 'read': true }, 
    'project': { 'create': true, 'read': true, 'edit': true },
    'user': { 'create': true, 'read': true, 'edit': true },
    'location': { 'read': true, 'edit': true }
  },
  'manager': {
    '*': { 'read': true },
    'sale': { 'create': true, 'read': true, 'edit': true },
    'location': { 'read': true, 'edit': true }
  },
  'supervisor': {
    '*': { 'read': true },
    'sale': { 'create': true, 'read': true, 'edit': true }
  },
  'promoter': {
    'sale': { 'create': true, 'read': true },
    'location': { 'read': true }
  },
  'sitechecker': {
    'location': { 'read': true },
    'session': { 'read': true }
  },
  'sale': {
    'sale': { 'create': true, 'read': true },
    'location': { 'read': true }
  },
  'staff': {
    '*': { 'read': true }
  },
  'guest': {
    'user': { 'read': true }
  }
};

function hasPermissionByRole(role, resource, action) {
  const rolePerms = rolePermissions[role];
  if (!rolePerms) return false;
  
  if (rolePerms['*'] && rolePerms['*'][action]) return true;
  if (rolePerms['*'] && rolePerms['*']['*']) return true;
  
  const resourcePerms = rolePerms[resource];
  if (resourcePerms) {
    if (resourcePerms[action]) return true;
    if (resourcePerms['*']) return true;
  }
  
  return false;
}

/**
 * Check if user has permission
 * @param {string} userId - User ID
 * @param {string} resource - Resource (obj)
 * @param {string} action - Action (act)
 * @param {string} projectId - Project ID
 * @returns {boolean}
 */
export async function hasPermission(userId, resource, action, projectId) {
  try {
    const user = await getUserById(userId);
    if (!user) return false;
    
    // Root có toàn quyền
    if (user.email === 'root@fafi.app' || user.role === 'root') {
      return true;
    }
    
    // Admin có toàn quyền nếu được gán tất cả projects (accessibleProjects === '*')
    const userProjectIds = user.projectIds || [];
    if (userProjectIds.length === 0) {
      return false;
    }
    
    // Nếu có projectId cụ thể, kiểm tra user có access project đó không
    if (projectId && projectId !== '*' && !userProjectIds.includes(projectId)) {
      return false;
    }
    
    // Lấy role của user
    const userRole = user.role || 'staff';
    
    // Check permission by role
    return hasPermissionByRole(userRole, resource, action);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Web-only RBAC with scope enforcement (org/project)
 * Input: user object (already in memory) to avoid extra reads when possible
 */
export async function hasPermissionWeb({ user, userId, resource, action = 'read', projectId = null, orgId = null }) {
  try {
    // Load user if not provided
    const u = user || (await getUserById(userId));
    if (!u) return false;

    // Root bypass
    if ((u.email || '') === 'root@fafi.app' || u.role === 'root') return true;

    // Role permission check (hardcoded policy)
    const role = u.role || 'staff';
    const roleAllowed = hasPermissionByRole(role, resource, action);
    if (!roleAllowed) return false;

    // Scope enforcement
    const userProjectIds = Array.isArray(u.projectIds) ? u.projectIds : [];
    const userOrgIds = Array.isArray(u.orgIds) ? u.orgIds : [];

    // If projectId provided, must be within user's projects
    if (projectId && projectId !== '*' && !userProjectIds.includes(projectId)) {
      return false;
    }

    // If orgId provided, must be within user's orgs
    if (orgId && orgId !== '*' && !userOrgIds.includes(orgId)) {
      return false;
    }

    // If action requires scope but none provided, deny for non-root
    const actionNeedsScope = action === 'create' || action === 'edit' || action === 'delete';
    if (actionNeedsScope && !projectId && !orgId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error hasPermissionWeb:', error);
    return false;
  }
}

/**
 * Get accessible project IDs for a user
 * @param {string} userId - User ID
 * @returns {string[]} - Array of project IDs
 */
export async function getAccessibleProjects(userId) {
  try {
    const user = await getUserById(userId);
    if (!user) return [];
    
    // Root có quyền truy cập tất cả
    if (user.email === 'root@fafi.app' || user.role === 'root') {
      return '*'; // Return '*' to indicate all access
    }
    
    return user.projectIds || [];
  } catch (error) {
    console.error('Error getting accessible projects:', error);
    return [];
  }
}

/**
 * Get user's role
 * @param {string} userId - User ID
 * @returns {string} - User role
 */
export async function getUserRole(userId) {
  try {
    const user = await getUserById(userId);
    if (!user) return null;
    
    return user.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user is root
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export async function isRootUser(userId) {
  try {
    const user = await getUserById(userId);
    if (!user) return false;
    
    return user.email === 'root@fafi.app' || user.role === 'root';
  } catch (error) {
    console.error('Error checking if user is root:', error);
    return false;
  }
}

/**
 * Filter data by user's accessible projects
 * @param {Array} data - Array of data items
 * @param {string} userId - User ID
 * @param {string} projectIdField - Field name for project ID (default: 'projectId')
 * @returns {Array} - Filtered array
 */
export async function filterDataByProjectAccess(data, userId, projectIdField = 'projectId') {
  try {
    const accessibleProjects = await getAccessibleProjects(userId);
    
    // Root has access to all
    if (accessibleProjects === '*') {
      return data;
    }
    
    // Filter by accessible projects
    return data.filter(item => {
      const itemProjectId = item[projectIdField];
      return accessibleProjects.includes(itemProjectId);
    });
  } catch (error) {
    console.error('Error filtering data by project access:', error);
    return [];
  }
}
