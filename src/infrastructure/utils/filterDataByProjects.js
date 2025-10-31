/**
 * Generic helper to filter data by accessible project IDs
 * Use this in all repositories to ensure data isolation by project
 * 
 * @param {Array} data - Array of data items
 * @param {string|Array} accessibleProjectIds - '*' or array of project IDs
 * @param {string} projectIdField - Field name containing project ID (default: 'projectId')
 * @returns {Array} - Filtered data array
 */
export function filterDataByProjectAccess(data, accessibleProjectIds, projectIdField = 'projectId') {
  // If null, undefined, or array and empty, return all
  if (!accessibleProjectIds) return data;
  
  // Root user has access to all (indicated by '*')
  if (accessibleProjectIds === '*') return data;
  
  // If not an array, return all (shouldn't happen but just in case)
  if (!Array.isArray(accessibleProjectIds)) return data;
  
  // Filter by accessible project IDs
  return data.filter(item => {
    const itemProjectId = item[projectIdField];
    return accessibleProjectIds.includes(itemProjectId);
  });
}

/**
 * Check if accessibleProjectIds includes a specific project
 * @param {string} projectId - Project ID to check
 * @param {string|Array} accessibleProjectIds - '*' or array of project IDs
 * @returns {boolean}
 */
export function hasAccessToProject(projectId, accessibleProjectIds) {
  if (!accessibleProjectIds || accessibleProjectIds === '*') return true;
  if (!Array.isArray(accessibleProjectIds)) return false;
  return accessibleProjectIds.includes(projectId);
}


