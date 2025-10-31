/**
 * Helper function để lọc data theo project IDs mà user có quyền truy cập
 * 
 * @param {Array} data - Array of data items
 * @param {string|Array} accessibleProjects - '*' hoặc array of project IDs
 * @param {string} projectIdField - Field name chứa projectId (default: 'projectId')
 * @returns {Array} - Filtered array
 */
export function filterByProjectAccess(data, accessibleProjects, projectIdField = 'projectId') {
  // Nếu accessibleProjects là '*' hoặc null hoặc không phải array, trả về tất cả
  if (!accessibleProjects || accessibleProjects === '*' || !Array.isArray(accessibleProjects)) {
    return data;
  }
  
  // Lọc data theo projectIds
  return data.filter(item => {
    const itemProjectId = item[projectIdField];
    return accessibleProjects.includes(itemProjectId);
  });
}

/**
 * Kiểm tra xem user có quyền truy cập một project cụ thể không
 * 
 * @param {string} projectId - Project ID cần kiểm tra
 * @param {string|Array} accessibleProjects - '*' hoặc array of project IDs
 * @returns {boolean}
 */
export function hasAccessToProject(projectId, accessibleProjects) {
  if (!accessibleProjects || accessibleProjects === '*') {
    return true;
  }
  
  if (!Array.isArray(accessibleProjects)) {
    return false;
  }
  
  return accessibleProjects.includes(projectId);
}


