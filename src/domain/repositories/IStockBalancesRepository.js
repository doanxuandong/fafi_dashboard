/**
 * Repository Interface for StockBalances (Domain Layer)
 */
export class IStockBalancesRepository {
  async listStockBalances(filters = {}) {
    throw new Error('Not implemented - this is an interface');
  }

  async getStockBalanceById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async createStockBalance(balanceData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async updateStockBalance(id, balanceData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async deleteStockBalance(id) {
    throw new Error('Not implemented - this is an interface');
  }
}

