/**
 * Use Case: Add User to Org
 */
export class AddUserToOrgUseCase {
  constructor(membersRepository) {
    this.membersRepository = membersRepository;
  }

  async execute(userId, orgId, role, tags, currentUserId) {
    // Business validation
    if (!userId || !orgId) {
      throw new Error('User ID and Org ID are required');
    }

    return await this.membersRepository.addUserToOrg(
      userId,
      orgId,
      role,
      tags,
      currentUserId
    );
  }
}

