/**
 * Use Case: Delete ACL Rule
 */
export class DeleteAclRuleUseCase {
  constructor(aclsRepository) {
    this.aclsRepository = aclsRepository;
  }

  async execute(id) {
    // Check if rule exists
    const rule = await this.aclsRepository.getAclById(id);
    if (!rule) {
      throw new Error('ACL Rule not found');
    }

    // Delete via repository
    await this.aclsRepository.deleteAclRule(id);
  }
}

