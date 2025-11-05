/**
 * Domain Entity: Setting
 * Pure business object - không phụ thuộc Firebase, React
 */
export class Setting {
  constructor({
    id,
    key,
    data = {},
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null
  }) {
    this.id = id || key;
    this.key = key;
    this.data = data || {};
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate setting data
   */
  validate() {
    if (!this.key || this.key.trim().length === 0) {
      throw new Error('Setting key is required');
    }
    return true;
  }

  /**
   * Business logic: Get setting value by path
   */
  getValue(path) {
    const keys = path.split('.');
    let value = this.data;
    for (const key of keys) {
      if (value === null || value === undefined) return null;
      value = value[key];
    }
    return value;
  }

  /**
   * Business logic: Set setting value by path
   */
  setValue(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let obj = this.data;
    
    for (const key of keys) {
      if (!obj[key] || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      obj = obj[key];
    }
    
    obj[lastKey] = value;
  }

  /**
   * Convert to plain object (for serialization)
   */
  toPlainObject() {
    return {
      id: this.id,
      key: this.key,
      data: this.data,
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
    return new Setting(data);
  }
}

