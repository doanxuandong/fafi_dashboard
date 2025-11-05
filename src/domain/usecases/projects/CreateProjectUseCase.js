import { Project } from '../../entities/Project.js';

/**
 * Use Case: Create Project
 * Business logic thuần túy
 */
export class CreateProjectUseCase {
  constructor(projectsRepository) {
    this.projectsRepository = projectsRepository;
  }

  /**
   * Execute use case
   * @param {Object} projectData - { name, description, orgId, tags? }
   * @param {Object} user - Current user
   * @returns {Promise<Project>}
   */
  async execute(projectData, user) {
    // Create Domain Entity
    const project = new Project({
      ...projectData,
      userIds: [user?.uid || 'system']
    });

    // Business validation
    project.validate();

    // Auto-generate keywords if not provided
    if (!project.keywords || project.keywords.length === 0) {
      project.keywords = project.generateKeywords();
    }

    // Save via repository
    const createdProject = await this.projectsRepository.createProject(
      project.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (createdProject instanceof Project) {
      return createdProject;
    }
    return Project.fromPlainObject(createdProject);
  }
}

