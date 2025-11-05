/**
 * Use Case: Create Project Location
 */
export class CreateProjectLocationUseCase {
  constructor(projectsLocationsRepository) {
    this.projectsLocationsRepository = projectsLocationsRepository;
  }

  async execute(data, user) {
    // Business validation
    if (!data.projectId || !data.locationId || !data.orgId) {
      throw new Error('Project ID, Location ID, and Org ID are required');
    }

    return await this.projectsLocationsRepository.createProjectLocation(data, user);
  }
}

