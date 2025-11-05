/**
 * Use Case: Get Project Members
 * Business logic cho members operations
 */
export class GetProjectMembersUseCase {
  constructor(membersRepository) {
    this.membersRepository = membersRepository;
  }

  async execute(projectId) {
    return await this.membersRepository.getProjectMembers(projectId);
  }
}

