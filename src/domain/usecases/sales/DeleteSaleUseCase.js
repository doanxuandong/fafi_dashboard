/**
 * Use Case: Delete Sale
 */
export class DeleteSaleUseCase {
  constructor(salesRepository) {
    this.salesRepository = salesRepository;
  }

  async execute(id) {
    // Check if sale exists
    const sale = await this.salesRepository.getSaleById(id);
    if (!sale) {
      throw new Error('Sale not found');
    }

    // Delete via repository
    await this.salesRepository.deleteSale(id);
  }
}

