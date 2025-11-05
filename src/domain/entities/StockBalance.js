/**
 * Domain Entity: StockBalance
 * Pure business object - không phụ thuộc Firebase, React
 */
export class StockBalance {
  constructor({
    id,
    assetId,
    assetName,
    assetSku,
    warehouseId,
    warehouseName,
    orgId,
    projectId,
    unitQty = 0,
    inboundUnitQty = 0,
    outboundUnitQty = 0,
    bookedUnitQty = 0,
    shrinkageUnitQty = 0,
    pack = '',
    unit = '',
    unitPerPack = 1,
    unitPerBundle = 1,
    keywords = [],
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null
  }) {
    this.id = id;
    this.assetId = assetId;
    this.assetName = assetName;
    this.assetSku = assetSku;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.orgId = orgId;
    this.projectId = projectId;
    this.unitQty = Number(unitQty) || 0;
    this.inboundUnitQty = Number(inboundUnitQty) || 0;
    this.outboundUnitQty = Number(outboundUnitQty) || 0;
    this.bookedUnitQty = Number(bookedUnitQty) || 0;
    this.shrinkageUnitQty = Number(shrinkageUnitQty) || 0;
    this.pack = pack;
    this.unit = unit;
    this.unitPerPack = Number(unitPerPack) || 1;
    this.unitPerBundle = Number(unitPerBundle) || 1;
    this.keywords = Array.isArray(keywords) ? keywords : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate balance data
   */
  validate() {
    if (!this.assetId) {
      throw new Error('Asset ID is required');
    }
    if (!this.warehouseId) {
      throw new Error('Warehouse ID is required');
    }
    if (!this.projectId) {
      throw new Error('Project ID is required');
    }
    return true;
  }

  /**
   * Business logic: Generate keywords for search
   */
  generateKeywords() {
    const keywords = [];
    const texts = [
      this.assetName,
      this.assetSku,
      this.warehouseName
    ].filter(Boolean);

    texts.forEach(text => {
      if (!text) return;
      const words = text.toLowerCase().split(/\s+/);
      
      keywords.push(text.toLowerCase());
      
      words.forEach(word => {
        if (word.length > 0) {
          keywords.push(word);
          for (let i = 1; i < word.length; i++) {
            keywords.push(word.substring(0, i));
          }
        }
      });
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Business logic: Calculate available stock
   */
  calculateAvailableStock() {
    return Math.max(0, this.unitQty - this.bookedUnitQty);
  }

  /**
   * Business logic: Check if stock is low (less than 10 units)
   */
  isLowStock(threshold = 10) {
    return this.calculateAvailableStock() < threshold;
  }

  /**
   * Convert to plain object (for serialization)
   */
  toPlainObject() {
    return {
      id: this.id,
      assetId: this.assetId,
      assetName: this.assetName,
      assetSku: this.assetSku,
      warehouseId: this.warehouseId,
      warehouseName: this.warehouseName,
      orgId: this.orgId,
      projectId: this.projectId,
      unitQty: this.unitQty,
      inboundUnitQty: this.inboundUnitQty,
      outboundUnitQty: this.outboundUnitQty,
      bookedUnitQty: this.bookedUnitQty,
      shrinkageUnitQty: this.shrinkageUnitQty,
      pack: this.pack,
      unit: this.unit,
      unitPerPack: this.unitPerPack,
      unitPerBundle: this.unitPerBundle,
      keywords: this.keywords,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }

  /**
   * Create from plain object (for deserialization)
   */
  static fromPlainObject(data) {
    return new StockBalance(data);
  }
}

