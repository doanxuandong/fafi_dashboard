import { Premium } from '../../entities/Premium.js';

/**
 * Use Case: Update Premium
 */
export class UpdatePremiumUseCase {
  constructor(premiumsRepository) {
    this.premiumsRepository = premiumsRepository;
  }

  async execute(id, premiumData, user) {
    // Get existing premium
    const existing = await this.premiumsRepository.getPremiumById(id);
    if (!existing) {
      throw new Error('Premium not found');
    }

    // Create Domain Entity with updated data
    const premium = Premium.fromPlainObject({
      ...existing,
      ...premiumData
    });

    // Business validation
    premium.validate();

    // Auto-update keywords if relevant fields changed
    const relevantFields = ['name', 'code'];
    if (relevantFields.some(field => premiumData[field] !== undefined)) {
      premium.keywords = premium.generateKeywords();
    }

    // Update via repository
    const updatedPremium = await this.premiumsRepository.updatePremium(
      id,
      premium.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (updatedPremium instanceof Premium) {
      return updatedPremium;
    }
    return Premium.fromPlainObject(updatedPremium);
  }
}

