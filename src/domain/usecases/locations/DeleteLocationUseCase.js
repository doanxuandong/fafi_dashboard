/**
 * Use Case: Delete Location
 */
export class DeleteLocationUseCase {
  constructor(locationsRepository) {
    this.locationsRepository = locationsRepository;
  }

  async execute(id) {
    // Check if location exists
    const location = await this.locationsRepository.getLocationById(id);
    if (!location) {
      throw new Error('Location not found');
    }

    // Delete via repository
    await this.locationsRepository.deleteLocation(id);
  }
}

