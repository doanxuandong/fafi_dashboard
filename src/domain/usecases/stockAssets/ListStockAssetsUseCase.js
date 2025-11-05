import { StockAsset } from '../../entities/StockAsset.js';

/**
 * Use Case: List Stock Assets
 */
export class ListStockAssetsUseCase {
  constructor(stockAssetsRepository) {
    this.stockAssetsRepository = stockAssetsRepository;
  }

  async execute(filters = {}) {
    const assets = await this.stockAssetsRepository.listStockAssets(filters);
    
    // Convert to Domain Entities
    return assets.map(a => {
      if (a instanceof StockAsset) {
        return a;
      }
      return StockAsset.fromPlainObject(a);
    });
  }
}

