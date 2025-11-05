import { Location } from '../../entities/Location.js';

/**
 * Use Case: List Locations
 */
export class ListLocationsUseCase {
  constructor(locationsRepository) {
    this.locationsRepository = locationsRepository;
  }

  async execute(filters = {}) {
    const locations = await this.locationsRepository.listLocations(filters);
    
    // Convert to Domain Entities
    return locations.map(l => {
      if (l instanceof Location) {
        return l;
      }
      return Location.fromPlainObject(l);
    });
  }
}

