import { StockAsset } from '../../entities/StockAsset.js';

/**
 * Use Case: Create Stock Asset
 */
export class CreateStockAssetUseCase {
  constructor(stockAssetsRepository) {
    this.stockAssetsRepository = stockAssetsRepository;
  }

  async execute(assetData, user) {
    // Create Domain Entity
    const asset = new StockAsset(assetData);

    // Business validation
    asset.validate();

    // Auto-generate keywords if not provided
    if (!asset.keywords || asset.keywords.length === 0) {
      asset.keywords = asset.generateKeywords();
    }

    // Save via repository
    const createdAsset = await this.stockAssetsRepository.createStockAsset(
      asset.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (createdAsset instanceof StockAsset) {
      return createdAsset;
    }
    return StockAsset.fromPlainObject(createdAsset);
  }
}

