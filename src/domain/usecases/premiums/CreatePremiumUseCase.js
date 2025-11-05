import { Premium } from '../../entities/Premium.js';

/**
 * Use Case: Create Premium
 */
export class CreatePremiumUseCase {
  constructor(premiumsRepository) {
    this.premiumsRepository = premiumsRepository;
  }

  async execute(premiumData, user) {
    // Create Domain Entity
    const premium = new Premium(premiumData);

    // Business validation
    premium.validate();

    // Auto-generate keywords if not provided
    if (!premium.keywords || premium.keywords.length === 0) {
      premium.keywords = premium.generateKeywords();
    }

    // Save via repository
    const createdPremium = await this.premiumsRepository.createPremium(
      premium.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (createdPremium instanceof Premium) {
      return createdPremium;
    }
    return Premium.fromPlainObject(createdPremium);
  }
}

