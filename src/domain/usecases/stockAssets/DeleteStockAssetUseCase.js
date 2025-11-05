/**
 * Use Case: Delete Stock Asset
 */
export class DeleteStockAssetUseCase {
  constructor(stockAssetsRepository) {
    this.stockAssetsRepository = stockAssetsRepository;
  }

  async execute(id) {
    // Check if asset exists
    const asset = await this.stockAssetsRepository.getStockAssetById(id);
    if (!asset) {
      throw new Error('Stock Asset not found');
    }

    // Delete via repository
    await this.stockAssetsRepository.deleteStockAsset(id);
  }
}

