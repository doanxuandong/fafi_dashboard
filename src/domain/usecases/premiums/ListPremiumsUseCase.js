import { Premium } from '../../entities/Premium.js';

/**
 * Use Case: List Premiums
 */
export class ListPremiumsUseCase {
  constructor(premiumsRepository) {
    this.premiumsRepository = premiumsRepository;
  }

  async execute(filters = {}) {
    const premiums = await this.premiumsRepository.listPremiums(filters);
    
    // Convert to Domain Entities
    return premiums.map(p => {
      if (p instanceof Premium) {
        return p;
      }
      return Premium.fromPlainObject(p);
    });
  }
}

