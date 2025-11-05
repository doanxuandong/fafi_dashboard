import { Location } from '../../entities/Location.js';

/**
 * Use Case: Update Location
 */
export class UpdateLocationUseCase {
  constructor(locationsRepository) {
    this.locationsRepository = locationsRepository;
  }

  async execute(id, locationData, user) {
    // Get existing location
    const existing = await this.locationsRepository.getLocationById(id);
    if (!existing) {
      throw new Error('Location not found');
    }

    // Create Domain Entity with updated data
    const location = Location.fromPlainObject({
      ...existing,
      ...locationData
    });

    // Business validation
    location.validate();

    // Auto-update keywords if relevant fields changed
    const relevantFields = ['name', 'code', 'ownerName', 'ownerPhoneNumer', 'saleName', 'salePhoneNumber'];
    if (relevantFields.some(field => locationData[field] !== undefined) || 
        locationData.locationMark !== undefined) {
      location.keywords = location.generateKeywords();
    }

    // Update via repository
    const updatedLocation = await this.locationsRepository.updateLocation(
      id,
      location.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (updatedLocation instanceof Location) {
      return updatedLocation;
    }
    return Location.fromPlainObject(updatedLocation);
  }
}

