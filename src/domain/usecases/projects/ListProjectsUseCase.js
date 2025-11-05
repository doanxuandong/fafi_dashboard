import { Project } from '../../entities/Project.js';

/**
 * Use Case: List Projects
 * Business logic thuần túy - không phụ thuộc React, Firebase
 */
export class ListProjectsUseCase {
  constructor(projectsRepository) {
    this.projectsRepository = projectsRepository;
  }

  /**
   * Execute use case
   * @param {Object} filters - { orgId?, search?, accessibleProjectIds? }
   * @returns {Promise<Project[]>}
   */
  async execute(filters = {}) {
    // Business logic: Filter by accessible projects
    const projects = await this.projectsRepository.listProjects(filters);
    
    // Convert to Domain Entities
    return projects.map(p => {
      if (p instanceof Project) {
        return p;
      }
      return Project.fromPlainObject(p);
    });
  }
}

