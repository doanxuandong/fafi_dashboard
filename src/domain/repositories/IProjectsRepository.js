/**
 * Repository Interface (Domain Layer)
 * Định nghĩa contract - KHÔNG có implementation
 * Infrastructure sẽ implement interface này
 */

/**
 * Interface cho Projects Repository
 * @interface IProjectsRepository
 */
export class IProjectsRepository {
  /**
   * List projects with filters
   * @param {Object} filters - { orgId?, search?, accessibleProjectIds? }
   * @returns {Promise<Project[]>}
   */
  async listProjects(filters = {}) {
    throw new Error('Not implemented - this is an interface');
  }

  /**
   * Get project by ID
   * @param {string} id
   * @returns {Promise<Project|null>}
   */
  async getProjectById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  /**
   * Create new project
   * @param {Object} projectData
   * @param {Object} user - Current user info
   * @returns {Promise<Project>}
   */
  async createProject(projectData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  /**
   * Update project
   * @param {string} id
   * @param {Object} projectData
   * @param {Object} user
   * @returns {Promise<Project>}
   */
  async updateProject(id, projectData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  /**
   * Delete project
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteProject(id) {
    throw new Error('Not implemented - this is an interface');
  }
}

