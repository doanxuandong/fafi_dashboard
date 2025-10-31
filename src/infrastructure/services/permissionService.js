import { listAcls } from '../repositories/aclsRepository';
import { getUserById } from '../repositories/usersRepository';

// Permission Resources (từ mobile app)
export const Resource = {
  user: 'user',
  org: 'org',
  project: 'project',
  location: 'location',
  session: 'session',
  consumer: 'consumer',
  sale: 'sale',
  sampling: 'sampling',
  product: 'product',
  premium: 'premium',
  promotionScheme: 'promotionScheme',
  stock: 'stock',
  report: 'report',
  photoReport: 'photoReport',
  appraisal: 'appraisal',
  questionnaire: 'questionnaire',
  system: 'system',
  schedule: 'schedule',
  posm: 'posm',
};

// Permission Actions (từ mobile app)
export const PermissionAction = {
  read: 'read',
  edit: 'edit',
  create: 'create',
  delete: 'delete',
  any: 'any',
};

// User Roles (từ mobile app)
export const UserRole = {
  root: 'root',
  guest: 'guest',
  owner: 'owner',
  client: 'client',
  manager: 'manager',
  admin: 'admin',
  supervisor: 'supervisor',
  promoter: 'promoter',
  sitechecker: 'sitechecker',
  sale: 'sale',
};

// Cache để tránh reload quá nhiều
let aclRulesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get user role from org member or project member
 */
export async function getUserRole(userId, orgId, projectId = null) {
  try {
    const user = await getUserById(userId);
    if (!user) return null;
    
    // TODO: Check orgs_members and projects_members collections
    // For now, assume role from user document
    return user.role || 'staff';
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user has permission for a resource and action
 * Using Casbin-like logic from mobile app
 */
export async function hasPermission({
  userId,
  orgId,
  projectId = null,
  resource,
  action,
  userRole = null,
}) {
  try {
    // Load ACL rules from Firebase
    const rules = await listAcls({ orgId, projectId });
    
    if (!rules || rules.length === 0) {
      // No rules defined, default deny
      return false;
    }
    
    // Get user role if not provided
    if (!userRole) {
      userRole = await getUserRole(userId, orgId, projectId);
      if (!userRole) return false;
    }
    
    // Check if user is org owner
    // TODO: Check org.createdBy === userId
    
    // Check if user is project owner
    if (projectId) {
      // TODO: Check project.createdBy === userId
    }
    
    // Find matching ACL rules
    const matchingRules = rules.filter(rule => 
      rule.role === userRole &&
      rule.resource === resource &&
      rule.permissionActions?.includes(action)
    );
    
    return matchingRules.length > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Get all permissions for a user role
 */
export async function getUserPermissions(orgId, projectId = null, role) {
  try {
    const rules = await listAcls({ orgId, projectId, role });
    return rules;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

