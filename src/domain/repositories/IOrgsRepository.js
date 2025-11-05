/**
 * Repository Interface for Orgs (Domain Layer)
 */
export class IOrgsRepository {
  async listOrgs() {
    throw new Error('Not implemented - this is an interface');
  }

  async getOrgById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async createOrg(orgData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async updateOrg(id, orgData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async deleteOrg(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async uploadOrgPhoto(orgId, file) {
    throw new Error('Not implemented - this is an interface');
  }
}

