import { Org } from '../../entities/Org.js';

/**
 * Use Case: Create Org
 */
export class CreateOrgUseCase {
  constructor(orgsRepository) {
    this.orgsRepository = orgsRepository;
  }

  async execute(orgData, user) {
    const org = new Org({
      ...orgData,
      userIds: [user?.uid || 'system']
    });

    // Business validation
    org.validate();

    // Auto-generate keywords if not provided
    if (!org.keywords || org.keywords.length === 0) {
      org.keywords = org.generateKeywords();
    }

    const createdOrg = await this.orgsRepository.createOrg(
      org.toPlainObject(),
      user
    );

    if (createdOrg instanceof Org) {
      return createdOrg;
    }
    return Org.fromPlainObject(createdOrg);
  }
}

