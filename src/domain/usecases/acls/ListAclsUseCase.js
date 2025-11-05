import { ACLRule } from '../../entities/ACLRule.js';

/**
 * Use Case: List ACL Rules
 */
export class ListAclsUseCase {
  constructor(aclsRepository) {
    this.aclsRepository = aclsRepository;
  }

  async execute(filters = {}) {
    const rules = await this.aclsRepository.listAcls(filters);
    
    // Convert to Domain Entities
    return rules.map(r => {
      if (r instanceof ACLRule) {
        return r;
      }
      return ACLRule.fromPlainObject(r);
    });
  }
}

