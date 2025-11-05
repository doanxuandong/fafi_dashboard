/**
 * Domain Entity: Sale
 * Pure business object - không phụ thuộc Firebase, React
 */
export class Sale {
  constructor({
    id,
    projectId,
    locationId,
    locationName,
    sessionId,
    buyerId,
    buyerName,
    buyerPhone,
    buyProducts = [],
    getPremiums = [],
    notes = '',
    otpCode = null,
    billPhotos = [],
    photos = [],
    totalAmount = 0,
    totalQuantity = 0,
    keywords = [],
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null,
    createdByName = null
  }) {
    this.id = id;
    this.projectId = projectId;
    this.locationId = locationId;
    this.locationName = locationName;
    this.sessionId = sessionId;
    this.buyerId = buyerId;
    this.buyerName = buyerName;
    this.buyerPhone = buyerPhone;
    this.buyProducts = Array.isArray(buyProducts) ? buyProducts : [];
    this.getPremiums = Array.isArray(getPremiums) ? getPremiums : [];
    this.notes = notes || '';
    this.otpCode = otpCode;
    this.billPhotos = Array.isArray(billPhotos) ? billPhotos : [];
    this.photos = Array.isArray(photos) ? photos : [];
    this.totalAmount = Number(totalAmount) || 0;
    this.totalQuantity = Number(totalQuantity) || 0;
    this.keywords = Array.isArray(keywords) ? keywords : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdByName = createdByName;
  }

  /**
   * Business logic: Validate sale data
   */
  validate() {
    if (!this.locationId || !this.projectId) {
      throw new Error('Location ID and Project ID are required');
    }
    return true;
  }

  /**
   * Business logic: Calculate total amount from buyProducts
   */
  calculateTotalAmount() {
    return (this.buyProducts || []).reduce((sum, product) => {
      const price = Number(product.unitPrice || 0);
      const qty = Number(product.unitQty || 0);
      return sum + (price * qty);
    }, 0);
  }

  /**
   * Business logic: Calculate total quantity from buyProducts
   */
  calculateTotalQuantity() {
    return (this.buyProducts || []).reduce((sum, product) => {
      return sum + Number(product.unitQty || 0);
    }, 0);
  }

  /**
   * Business logic: Generate keywords for search
   */
  generateKeywords() {
    const keywords = [];
    const texts = [this.buyerName, this.buyerPhone, this.notes, this.otpCode].filter(Boolean);
    
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
   * Convert to plain object (for serialization)
   */
  toPlainObject() {
    return {
      id: this.id,
      projectId: this.projectId,
      locationId: this.locationId,
      locationName: this.locationName,
      sessionId: this.sessionId,
      buyerId: this.buyerId,
      buyerName: this.buyerName,
      buyerPhone: this.buyerPhone,
      buyProducts: this.buyProducts,
      getPremiums: this.getPremiums,
      notes: this.notes,
      otpCode: this.otpCode,
      billPhotos: this.billPhotos,
      photos: this.photos,
      totalAmount: this.totalAmount,
      totalQuantity: this.totalQuantity,
      keywords: this.keywords,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdByName: this.createdByName
    };
  }

  /**
   * Create from plain object (for deserialization)
   */
  static fromPlainObject(data) {
    return new Sale(data);
  }
}

