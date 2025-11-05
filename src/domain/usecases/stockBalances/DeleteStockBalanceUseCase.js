/**
 * Use Case: Delete Stock Balance
 */
export class DeleteStockBalanceUseCase {
  constructor(stockBalancesRepository) {
    this.stockBalancesRepository = stockBalancesRepository;
  }

  async execute(id) {
    // Check if balance exists
    const balance = await this.stockBalancesRepository.getStockBalanceById(id);
    if (!balance) {
      throw new Error('Stock Balance not found');
    }

    // Delete via repository
    await this.stockBalancesRepository.deleteStockBalance(id);
  }
}

