import { StockBalance } from '../../entities/StockBalance.js';

/**
 * Use Case: Update Stock Balance
 */
export class UpdateStockBalanceUseCase {
  constructor(stockBalancesRepository) {
    this.stockBalancesRepository = stockBalancesRepository;
  }

  async execute(id, balanceData, user) {
    // Get existing balance
    const existing = await this.stockBalancesRepository.getStockBalanceById(id);
    if (!existing) {
      throw new Error('Stock Balance not found');
    }

    // Create Domain Entity with updated data
    const balance = StockBalance.fromPlainObject({
      ...existing,
      ...balanceData
    });

    // Business validation
    balance.validate();

    // Auto-update keywords if relevant fields changed
    const relevantFields = ['assetName', 'assetSku', 'warehouseName'];
    if (relevantFields.some(field => balanceData[field] !== undefined)) {
      balance.keywords = balance.generateKeywords();
    }

    // Update via repository
    const updatedBalance = await this.stockBalancesRepository.updateStockBalance(
      id,
      balance.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (updatedBalance instanceof StockBalance) {
      return updatedBalance;
    }
    return StockBalance.fromPlainObject(updatedBalance);
  }
}

