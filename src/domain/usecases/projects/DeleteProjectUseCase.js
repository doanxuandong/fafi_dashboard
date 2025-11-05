/**
 * Use Case: Delete Project
 */
export class DeleteProjectUseCase {
  constructor(projectsRepository) {
    this.projectsRepository = projectsRepository;
  }

  async execute(id) {
    // Check if project exists
    const project = await this.projectsRepository.getProjectById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Business logic: Could add validation here
    // e.g., check if project has dependencies, etc.

    // Delete via repository
    await this.projectsRepository.deleteProject(id);
  }
}

