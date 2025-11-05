import { StockAsset } from '../../entities/StockAsset.js';

/**
 * Use Case: Update Stock Asset
 */
export class UpdateStockAssetUseCase {
  constructor(stockAssetsRepository) {
    this.stockAssetsRepository = stockAssetsRepository;
  }

  async execute(id, assetData, user) {
    // Get existing asset
    const existing = await this.stockAssetsRepository.getStockAssetById(id);
    if (!existing) {
      throw new Error('Stock Asset not found');
    }

    // Create Domain Entity with updated data
    const asset = StockAsset.fromPlainObject({
      ...existing,
      ...assetData
    });

    // Business validation
    asset.validate();

    // Auto-update keywords if relevant fields changed
    const relevantFields = ['name', 'sku', 'description', 'clientName'];
    if (relevantFields.some(field => assetData[field] !== undefined)) {
      asset.keywords = asset.generateKeywords();
    }

    // Update via repository
    const updatedAsset = await this.stockAssetsRepository.updateStockAsset(
      id,
      asset.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (updatedAsset instanceof StockAsset) {
      return updatedAsset;
    }
    return StockAsset.fromPlainObject(updatedAsset);
  }
}

