/**
 * Repository Interface for Premiums (Domain Layer)
 */
export class IPremiumsRepository {
  async listPremiums(filters = {}) {
    throw new Error('Not implemented - this is an interface');
  }

  async getPremiumById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async createPremium(premiumData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async updatePremium(id, premiumData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async deletePremium(id) {
    throw new Error('Not implemented - this is an interface');
  }
}

