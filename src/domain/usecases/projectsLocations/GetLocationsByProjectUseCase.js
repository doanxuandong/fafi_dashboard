/**
 * Use Case: Get Locations by Project
 */
export class GetLocationsByProjectUseCase {
  constructor(projectsLocationsRepository) {
    this.projectsLocationsRepository = projectsLocationsRepository;
  }

  async execute(projectId) {
    return await this.projectsLocationsRepository.getLocationsByProject(projectId);
  }
}

