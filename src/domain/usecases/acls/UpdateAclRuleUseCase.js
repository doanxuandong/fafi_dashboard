import { ACLRule } from '../../entities/ACLRule.js';

/**
 * Use Case: Update ACL Rule
 */
export class UpdateAclRuleUseCase {
  constructor(aclsRepository) {
    this.aclsRepository = aclsRepository;
  }

  async execute(id, ruleData, user) {
    // Get existing rule
    const existing = await this.aclsRepository.getAclById(id);
    if (!existing) {
      throw new Error('ACL Rule not found');
    }

    // Create Domain Entity with updated data
    const rule = ACLRule.fromPlainObject({
      ...existing,
      ...ruleData
    });

    // Business validation
    rule.validate();

    // Update via repository
    const updatedRule = await this.aclsRepository.updateAclRule(
      id,
      rule.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (updatedRule instanceof ACLRule) {
      return updatedRule;
    }
    return ACLRule.fromPlainObject(updatedRule);
  }
}

