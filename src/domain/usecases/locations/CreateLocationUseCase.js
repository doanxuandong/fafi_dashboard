import { Location } from '../../entities/Location.js';

/**
 * Use Case: Create Location
 */
export class CreateLocationUseCase {
  constructor(locationsRepository) {
    this.locationsRepository = locationsRepository;
  }

  async execute(locationData, user) {
    // Create Domain Entity
    const location = new Location(locationData);

    // Business validation
    location.validate();

    // Auto-generate keywords if not provided
    if (!location.keywords || location.keywords.length === 0) {
      location.keywords = location.generateKeywords();
    }

    // Save via repository
    const createdLocation = await this.locationsRepository.createLocation(
      location.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (createdLocation instanceof Location) {
      return createdLocation;
    }
    return Location.fromPlainObject(createdLocation);
  }
}

