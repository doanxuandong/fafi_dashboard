import { Setting } from '../../entities/Setting.js';

/**
 * Use Case: Get Settings by Key
 */
export class GetSettingsUseCase {
  constructor(settingsRepository) {
    this.settingsRepository = settingsRepository;
  }

  async execute(key) {
    const data = await this.settingsRepository.getSettingsByKey(key);
    
    if (!data) {
      return null;
    }

    // Convert to Domain Entity
    const setting = new Setting({
      id: data.id || key,
      key: key,
      data: data,
      ...data
    });

    return setting;
  }
}

