/**
 * Use Case: Delete Org
 */
export class DeleteOrgUseCase {
  constructor(orgsRepository) {
    this.orgsRepository = orgsRepository;
  }

  async execute(id) {
    const org = await this.orgsRepository.getOrgById(id);
    if (!org) {
      throw new Error('Org not found');
    }

    await this.orgsRepository.deleteOrg(id);
  }
}

