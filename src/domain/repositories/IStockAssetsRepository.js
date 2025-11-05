/**
 * Repository Interface for StockAssets (Domain Layer)
 */
export class IStockAssetsRepository {
  async listStockAssets(filters = {}) {
    throw new Error('Not implemented - this is an interface');
  }

  async getStockAssetById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async createStockAsset(assetData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async updateStockAsset(id, assetData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async deleteStockAsset(id) {
    throw new Error('Not implemented - this is an interface');
  }
}

