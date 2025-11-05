/**
 * Repository Interface for ACLs (Domain Layer)
 */
export class IACLsRepository {
  async listAcls(filters = {}) {
    throw new Error('Not implemented - this is an interface');
  }

  async getAclById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async createAclRule(ruleData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async updateAclRule(id, ruleData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async deleteAclRule(id) {
    throw new Error('Not implemented - this is an interface');
  }
}

