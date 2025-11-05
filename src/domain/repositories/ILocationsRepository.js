/**
 * Repository Interface for Locations (Domain Layer)
 */
export class ILocationsRepository {
  async listLocations(filters = {}) {
    throw new Error('Not implemented - this is an interface');
  }

  async getLocationById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async createLocation(locationData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async updateLocation(id, locationData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async deleteLocation(id) {
    throw new Error('Not implemented - this is an interface');
  }
}

