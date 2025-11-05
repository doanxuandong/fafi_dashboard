import { StockBalance } from '../../entities/StockBalance.js';

/**
 * Use Case: List Stock Balances
 */
export class ListStockBalancesUseCase {
  constructor(stockBalancesRepository) {
    this.stockBalancesRepository = stockBalancesRepository;
  }

  async execute(filters = {}) {
    const balances = await this.stockBalancesRepository.listStockBalances(filters);
    
    // Convert to Domain Entities
    return balances.map(b => {
      if (b instanceof StockBalance) {
        return b;
      }
      return StockBalance.fromPlainObject(b);
    });
  }
}

