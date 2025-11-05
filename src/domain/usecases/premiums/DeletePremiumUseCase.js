/**
 * Use Case: Delete Premium
 */
export class DeletePremiumUseCase {
  constructor(premiumsRepository) {
    this.premiumsRepository = premiumsRepository;
  }

  async execute(id) {
    // Check if premium exists
    const premium = await this.premiumsRepository.getPremiumById(id);
    if (!premium) {
      throw new Error('Premium not found');
    }

    // Delete via repository
    await this.premiumsRepository.deletePremium(id);
  }
}

