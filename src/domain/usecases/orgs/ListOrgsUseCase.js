import { Org } from '../../entities/Org.js';

/**
 * Use Case: List Orgs
 */
export class ListOrgsUseCase {
  constructor(orgsRepository) {
    this.orgsRepository = orgsRepository;
  }

  async execute() {
    const orgs = await this.orgsRepository.listOrgs();
    
    // Convert to Domain Entities
    return orgs.map(o => {
      if (o instanceof Org) {
        return o;
      }
      return Org.fromPlainObject(o);
    });
  }
}

