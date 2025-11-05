/**
 * Domain Entity: Schedule
 * Pure business object - không phụ thuộc Firebase, React
 */
export class Schedule {
  constructor({
    id,
    locationId,
    locationName,
    projectId,
    startAt,
    endAt,
    members = [],
    notes = '',
    active = true,
    keywords = [],
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null
  }) {
    this.id = id;
    this.locationId = locationId;
    this.locationName = locationName;
    this.projectId = projectId;
    this.startAt = startAt;
    this.endAt = endAt;
    this.members = Array.isArray(members) ? members : [];
    this.notes = notes || '';
    this.active = active !== undefined ? active : true;
    this.keywords = Array.isArray(keywords) ? keywords : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate schedule data
   */
  validate() {
    if (!this.locationId || !this.projectId) {
      throw new Error('Location ID and Project ID are required');
    }
    if (!this.startAt || !this.endAt) {
      throw new Error('Start date and End date are required');
    }
    
    // Validate date range
    const startDate = this.startAt?.toDate ? this.startAt.toDate() : 
                     (this.startAt?.seconds ? new Date(this.startAt.seconds * 1000) : 
                     new Date(this.startAt));
    const endDate = this.endAt?.toDate ? this.endAt.toDate() : 
                   (this.endAt?.seconds ? new Date(this.endAt.seconds * 1000) : 
                   new Date(this.endAt));
    
    if (startDate >= endDate) {
      throw new Error('End date must be after start date');
    }
    
    return true;
  }

  /**
   * Business logic: Generate keywords for search
   */
  generateKeywords() {
    const keywords = [];
    const texts = [
      this.notes,
      this.locationName
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
      locationId: this.locationId,
      locationName: this.locationName,
      projectId: this.projectId,
      startAt: this.startAt,
      endAt: this.endAt,
      members: this.members,
      notes: this.notes,
      active: this.active,
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
    return new Schedule(data);
  }
}

