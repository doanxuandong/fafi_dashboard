/**
 * Domain Entity: StockAsset
 * Pure business object - không phụ thuộc Firebase, React
 */
export class StockAsset {
  constructor({
    id,
    name,
    sku = '',
    description = '',
    type = '',
    brandFamilyCode = '',
    clientId = '',
    clientName = '',
    orgId = '',
    projectId = '',
    pack = '',
    unit = '',
    unitPerPack = 1,
    unitPerBundle = 1,
    unitPrice = 0,
    packPrice = 0,
    packHeight = 0,
    packLength = 0,
    packWeight = 0,
    packWidth = 0,
    mfgDate = null,
    expDate = null,
    available = true,
    tags = [],
    photos = [],
    keywords = [],
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null
  }) {
    this.id = id;
    this.name = name;
    this.sku = sku;
    this.description = description;
    this.type = type;
    this.brandFamilyCode = brandFamilyCode;
    this.clientId = clientId;
    this.clientName = clientName;
    this.orgId = orgId;
    this.projectId = projectId;
    this.pack = pack;
    this.unit = unit;
    this.unitPerPack = Number(unitPerPack) || 1;
    this.unitPerBundle = Number(unitPerBundle) || 1;
    this.unitPrice = Number(unitPrice) || 0;
    this.packPrice = Number(packPrice) || 0;
    this.packHeight = Number(packHeight) || 0;
    this.packLength = Number(packLength) || 0;
    this.packWeight = Number(packWeight) || 0;
    this.packWidth = Number(packWidth) || 0;
    this.mfgDate = mfgDate;
    this.expDate = expDate;
    this.available = available !== undefined ? available : true;
    this.tags = Array.isArray(tags) ? tags : [];
    this.photos = Array.isArray(photos) ? photos : [];
    this.keywords = Array.isArray(keywords) ? keywords : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate asset data
   */
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Asset name is required');
    }
    return true;
  }

  /**
   * Business logic: Generate keywords for search
   */
  generateKeywords() {
    const keywords = [];
    const texts = [
      this.name,
      this.sku,
      this.description,
      this.clientName
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
   * Business logic: Check if asset is expired
   */
  isExpired() {
    if (!this.expDate) return false;
    const expDate = this.expDate?.toDate ? this.expDate.toDate() : 
                   (this.expDate?.seconds ? new Date(this.expDate.seconds * 1000) : 
                   new Date(this.expDate));
    return expDate < new Date();
  }

  /**
   * Business logic: Check if asset is expiring soon (within 30 days)
   */
  isExpiringSoon(days = 30) {
    if (!this.expDate) return false;
    const expDate = this.expDate?.toDate ? this.expDate.toDate() : 
                   (this.expDate?.seconds ? new Date(this.expDate.seconds * 1000) : 
                   new Date(this.expDate));
    const now = new Date();
    const diffTime = expDate - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  }

  /**
   * Convert to plain object (for serialization)
   */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      description: this.description,
      type: this.type,
      brandFamilyCode: this.brandFamilyCode,
      clientId: this.clientId,
      clientName: this.clientName,
      orgId: this.orgId,
      projectId: this.projectId,
      pack: this.pack,
      unit: this.unit,
      unitPerPack: this.unitPerPack,
      unitPerBundle: this.unitPerBundle,
      unitPrice: this.unitPrice,
      packPrice: this.packPrice,
      packHeight: this.packHeight,
      packLength: this.packLength,
      packWeight: this.packWeight,
      packWidth: this.packWidth,
      mfgDate: this.mfgDate,
      expDate: this.expDate,
      available: this.available,
      tags: this.tags,
      photos: this.photos,
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
    return new StockAsset(data);
  }
}

