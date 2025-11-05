/**
 * Domain Entity: Project
 * Pure business object - không phụ thuộc Firebase, React, hay bất kỳ framework nào
 */
export class Project {
  constructor({
    id,
    name,
    description,
    orgId,
    tags = [],
    keywords = [],
    userIds = [],
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null
  }) {
    this.id = id;
    this.name = name;
    this.description = description || '';
    this.orgId = orgId;
    this.tags = Array.isArray(tags) ? tags : [];
    this.keywords = Array.isArray(keywords) ? keywords : [];
    this.userIds = Array.isArray(userIds) ? userIds : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate project data
   */
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Project name is required');
    }
    if (!this.orgId) {
      throw new Error('Organization ID is required');
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
      description: this.description,
      orgId: this.orgId,
      tags: this.tags,
      keywords: this.keywords,
      userIds: this.userIds,
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
    return new Project(data);
  }
}

