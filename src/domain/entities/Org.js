/**
 * Domain Entity: Org
 * Pure business object - không phụ thuộc Firebase, React
 */
export class Org {
  constructor({
    id,
    name,
    code = null,
    description = null,
    photoUrls = [],
    keywords = [],
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null
  }) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.description = description;
    this.photoUrls = Array.isArray(photoUrls) ? photoUrls : [];
    this.keywords = Array.isArray(keywords) ? keywords : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate org data
   */
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Org name is required');
    }
    return true;
  }

  /**
   * Business logic: Generate keywords from name
   */
  generateKeywords() {
    const text = (this.name || '').toLowerCase().trim();
    const parts = text.split(/\s+/);
    const result = new Set();
    
    for (const part of parts) {
      for (let i = 1; i <= part.length; i++) {
        result.add(part.slice(0, i));
      }
    }
    result.add(text);
    return Array.from(result);
  }

  /**
   * Convert to plain object (for serialization)
   */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      description: this.description,
      photoUrls: this.photoUrls,
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
    return new Org(data);
  }
}

