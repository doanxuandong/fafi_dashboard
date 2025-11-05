/**
 * Domain Entity: Premium
 * Pure business object - không phụ thuộc Firebase, React
 */
export class Premium {
  constructor({
    id,
    name,
    code = '',
    projectId = '',
    price = 0,
    amount = 0,
    stockIn = 0,
    stockOut = 0,
    available = true,
    photos = [],
    tags = [],
    options = {},
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
    this.price = Number(price) || 0;
    this.amount = Number(amount) || 0;
    this.stockIn = Number(stockIn) || 0;
    this.stockOut = Number(stockOut) || 0;
    this.available = available !== undefined ? available : true;
    this.photos = Array.isArray(photos) ? photos : [];
    this.tags = Array.isArray(tags) ? tags : [];
    this.options = options || {};
    this.keywords = Array.isArray(keywords) ? keywords : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate premium data
   */
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Premium name is required');
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
    
    return Array.from(keywords);
  }

  /**
   * Business logic: Calculate current stock
   */
  calculateCurrentStock() {
    return this.stockIn - this.stockOut;
  }

  /**
   * Business logic: Calculate total value
   */
  calculateTotalValue() {
    return this.calculateCurrentStock() * this.price;
  }

  /**
   * Business logic: Check if premium is low stock
   */
  isLowStock(threshold = 10) {
    return this.calculateCurrentStock() < threshold;
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
      price: this.price,
      amount: this.amount,
      stockIn: this.stockIn,
      stockOut: this.stockOut,
      available: this.available,
      photos: this.photos,
      tags: this.tags,
      options: this.options,
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
    return new Premium(data);
  }
}

