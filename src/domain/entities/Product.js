/**
 * Domain Entity: Product
 * Pure business object - không phụ thuộc Firebase, React
 */
export class Product {
  constructor({
    id,
    name,
    code = '',
    projectId = '',
    clientId = '',
    brandFamilyCode = '',
    unitPrice = 0,
    pack = '',
    unit = '',
    unitQty = 0,
    soldUnitQty = 0,
    available = true,
    photos = [],
    tags = [],
    keywords = [],
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null
  }) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.projectId = projectId;
    this.clientId = clientId;
    this.brandFamilyCode = brandFamilyCode;
    this.unitPrice = Number(unitPrice) || 0;
    this.pack = pack;
    this.unit = unit;
    this.unitQty = Number(unitQty) || 0;
    this.soldUnitQty = Number(soldUnitQty) || 0;
    this.available = available !== undefined ? available : true;
    this.photos = Array.isArray(photos) ? photos : [];
    this.tags = Array.isArray(tags) ? tags : [];
    this.keywords = Array.isArray(keywords) ? keywords : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate product data
   */
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Product name is required');
    }
    return true;
  }

  /**
   * Business logic: Generate keywords for search
   */
  generateKeywords() {
    const keywords = new Set();
    
    if (this.code) keywords.add(this.code.toLowerCase());
    
    if (this.name) {
      const nameWords = this.name.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      nameWords.forEach(word => {
        keywords.add(word);
        for (let i = 1; i <= word.length; i++) {
          keywords.add(word.slice(0, i));
        }
      });
    }
    
    if (this.brandFamilyCode) {
      keywords.add(this.brandFamilyCode.toLowerCase());
    }
    
    return Array.from(keywords);
  }

  /**
   * Business logic: Calculate total value
   */
  calculateTotalValue() {
    return this.unitQty * this.unitPrice;
  }

  /**
   * Business logic: Check if product is low stock
   */
  isLowStock(threshold = 10) {
    return this.unitQty < threshold;
  }

  /**
   * Convert to plain object (for serialization)
   */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      projectId: this.projectId,
      clientId: this.clientId,
      brandFamilyCode: this.brandFamilyCode,
      unitPrice: this.unitPrice,
      pack: this.pack,
      unit: this.unit,
      unitQty: this.unitQty,
      soldUnitQty: this.soldUnitQty,
      available: this.available,
      photos: this.photos,
      tags: this.tags,
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
    return new Product(data);
  }
}

