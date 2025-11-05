/**
 * Domain Entity: Location
 * Pure business object - không phụ thuộc Firebase, React
 */
export class Location {
  constructor({
    id,
    name,
    code,
    orgId,
    projectId,
    status = 'sitecheck',
    level = 0,
    type = '',
    tier = '',
    ownerName = '',
    ownerPhoneNumer = '',
    saleName = '',
    salePhoneNumber = '',
    saleTitle = '',
    availableStock = true,
    tags = [],
    locationMark = {},
    warehouseProperties = {},
    keywords = [],
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null
  }) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.orgId = orgId;
    this.projectId = projectId;
    this.status = status;
    this.level = level;
    this.type = type;
    this.tier = tier;
    this.ownerName = ownerName;
    this.ownerPhoneNumer = ownerPhoneNumer;
    this.saleName = saleName;
    this.salePhoneNumber = salePhoneNumber;
    this.saleTitle = saleTitle;
    this.availableStock = availableStock;
    this.tags = Array.isArray(tags) ? tags : [];
    this.locationMark = locationMark || {};
    this.warehouseProperties = warehouseProperties || {};
    this.keywords = Array.isArray(keywords) ? keywords : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate location data
   */
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Location name is required');
    }
    if (!this.orgId) {
      throw new Error('Organization ID is required');
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
      this.name,
      this.code,
      this.locationMark?.address,
      this.locationMark?.formattedAddress,
      this.ownerName,
      this.ownerPhoneNumer,
      this.saleName,
      this.salePhoneNumber
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
   * Convert to plain object (for serialization)
   */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      orgId: this.orgId,
      projectId: this.projectId,
      status: this.status,
      level: this.level,
      type: this.type,
      tier: this.tier,
      ownerName: this.ownerName,
      ownerPhoneNumer: this.ownerPhoneNumer,
      saleName: this.saleName,
      salePhoneNumber: this.salePhoneNumber,
      saleTitle: this.saleTitle,
      availableStock: this.availableStock,
      tags: this.tags,
      locationMark: this.locationMark,
      warehouseProperties: this.warehouseProperties,
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
    return new Location(data);
  }
}

