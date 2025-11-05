/**
 * Use Case: Delete Project Location
 */
export class DeleteProjectLocationUseCase {
  constructor(projectsLocationsRepository) {
    this.projectsLocationsRepository = projectsLocationsRepository;
  }

  async execute(projectId, locationId) {
    // Business validation
    if (!projectId || !locationId) {
      throw new Error('Project ID and Location ID are required');
    }

    return await this.projectsLocationsRepository.deleteProjectLocation(projectId, locationId);
  }
}

