import { Setting } from '../../entities/Setting.js';

/**
 * Use Case: Save Settings by Key
 */
export class SaveSettingsUseCase {
  constructor(settingsRepository) {
    this.settingsRepository = settingsRepository;
  }

  async execute(key, data, user) {
    // Create Domain Entity
    const setting = new Setting({
      key: key,
      data: data
    });

    // Business validation
    setting.validate();

    // Save via repository
    await this.settingsRepository.saveSettingsByKey(key, data);

    // Return updated setting
    const updatedData = await this.settingsRepository.getSettingsByKey(key);
    if (!updatedData) {
      return setting;
    }

    return Setting.fromPlainObject({
      id: updatedData.id || key,
      key: key,
      data: updatedData,
      ...updatedData
    });
  }
}

