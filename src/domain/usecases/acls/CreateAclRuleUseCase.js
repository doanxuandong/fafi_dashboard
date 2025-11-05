import { ACLRule } from '../../entities/ACLRule.js';

/**
 * Use Case: Create ACL Rule
 */
export class CreateAclRuleUseCase {
  constructor(aclsRepository) {
    this.aclsRepository = aclsRepository;
  }

  async execute(ruleData, user) {
    // Create Domain Entity
    const rule = new ACLRule({
      ...ruleData,
      owner: ruleData.owner || user?.uid || 'system'
    });

    // Business validation
    rule.validate();

    // Save via repository
    const createdRule = await this.aclsRepository.createAclRule(
      rule.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (createdRule instanceof ACLRule) {
      return createdRule;
    }
    return ACLRule.fromPlainObject(createdRule);
  }
}

