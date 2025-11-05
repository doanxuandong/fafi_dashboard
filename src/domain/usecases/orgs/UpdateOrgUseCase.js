import { Org } from '../../entities/Org.js';

/**
 * Use Case: Update Org
 */
export class UpdateOrgUseCase {
  constructor(orgsRepository) {
    this.orgsRepository = orgsRepository;
  }

  async execute(id, orgData, user) {
    const existing = await this.orgsRepository.getOrgById(id);
    if (!existing) {
      throw new Error('Org not found');
    }

    const org = Org.fromPlainObject({
      ...existing,
      ...orgData
    });

    org.validate();

    // Auto-update keywords if name changed
    if (orgData.name && orgData.name !== existing.name) {
      org.keywords = org.generateKeywords();
    }

    const updatedOrg = await this.orgsRepository.updateOrg(
      id,
      org.toPlainObject(),
      user
    );

    if (updatedOrg instanceof Org) {
      return updatedOrg;
    }
    return Org.fromPlainObject(updatedOrg);
  }
}

