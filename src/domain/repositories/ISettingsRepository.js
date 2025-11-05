/**
 * Repository Interface for Settings (Domain Layer)
 */
export class ISettingsRepository {
  async getSettingsByKey(key) {
    throw new Error('Not implemented - this is an interface');
  }

  async saveSettingsByKey(key, data) {
    throw new Error('Not implemented - this is an interface');
  }
}

