import { Project } from '../../entities/Project.js';

/**
 * Use Case: Update Project
 */
export class UpdateProjectUseCase {
  constructor(projectsRepository) {
    this.projectsRepository = projectsRepository;
  }

  async execute(id, projectData, user) {
    // Get existing project
    const existing = await this.projectsRepository.getProjectById(id);
    if (!existing) {
      throw new Error('Project not found');
    }

    // Create Domain Entity with updated data
    const project = Project.fromPlainObject({
      ...existing,
      ...projectData
    });

    // Business validation
    project.validate();

    // Auto-update keywords if name changed
    if (projectData.name && projectData.name !== existing.name) {
      project.keywords = project.generateKeywords();
    }

    // Update via repository
    const updatedProject = await this.projectsRepository.updateProject(
      id,
      project.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (updatedProject instanceof Project) {
      return updatedProject;
    }
    return Project.fromPlainObject(updatedProject);
  }
}

