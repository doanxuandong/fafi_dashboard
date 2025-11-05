import { StockBalance } from '../../entities/StockBalance.js';

/**
 * Use Case: Create Stock Balance
 */
export class CreateStockBalanceUseCase {
  constructor(stockBalancesRepository) {
    this.stockBalancesRepository = stockBalancesRepository;
  }

  async execute(balanceData, user) {
    // Create Domain Entity
    const balance = new StockBalance(balanceData);

    // Business validation
    balance.validate();

    // Auto-generate keywords if not provided
    if (!balance.keywords || balance.keywords.length === 0) {
      balance.keywords = balance.generateKeywords();
    }

    // Save via repository
    const createdBalance = await this.stockBalancesRepository.createStockBalance(
      balance.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (createdBalance instanceof StockBalance) {
      return createdBalance;
    }
    return StockBalance.fromPlainObject(createdBalance);
  }
}

