/**
 * Use Case: Add User to Project
 */
export class AddUserToProjectUseCase {
  constructor(membersRepository) {
    this.membersRepository = membersRepository;
  }

  async execute(userId, projectId, orgId, role, tags, currentUserId) {
    // Business validation
    if (!userId || !projectId || !orgId) {
      throw new Error('User ID, Project ID, and Org ID are required');
    }

    return await this.membersRepository.addUserToProject(
      userId,
      projectId,
      orgId,
      role,
      tags,
      currentUserId
    );
  }
}

