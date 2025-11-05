/**
 * Use Case: Get Org Members
 */
export class GetOrgMembersUseCase {
  constructor(membersRepository) {
    this.membersRepository = membersRepository;
  }

  async execute(orgId) {
    return await this.membersRepository.getOrgMembers(orgId);
  }
}

