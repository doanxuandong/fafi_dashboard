/**
 * Domain Entity: ACLRule
 * Pure business object - không phụ thuộc Firebase, React
 */
export class ACLRule {
  constructor({
    id,
    orgId,
    projectId = null,
    role,
    resource,
    permissionActions = [],
    owner = null,
    createdAt = null,
    updatedAt = null,
    createdBy = null,
    updatedBy = null
  }) {
    this.id = id;
    this.orgId = orgId;
    this.projectId = projectId;
    this.role = role;
    this.resource = resource;
    this.permissionActions = Array.isArray(permissionActions) ? permissionActions : [];
    this.owner = owner;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }

  /**
   * Business logic: Validate ACL rule data
   */
  validate() {
    if (!this.orgId) {
      throw new Error('Organization ID is required');
    }
    if (!this.role) {
      throw new Error('Role is required');
    }
    if (!this.resource) {
      throw new Error('Resource is required');
    }
    if (!Array.isArray(this.permissionActions) || this.permissionActions.length === 0) {
      throw new Error('At least one permission action is required');
    }
    return true;
  }

  /**
   * Business logic: Check if rule has specific action
   */
  hasAction(action) {
    return this.permissionActions.includes(action);
  }

  /**
   * Business logic: Add action to rule
   */
  addAction(action) {
    if (!this.permissionActions.includes(action)) {
      this.permissionActions.push(action);
    }
  }

  /**
   * Business logic: Remove action from rule
   */
  removeAction(action) {
    this.permissionActions = this.permissionActions.filter(a => a !== action);
  }

  /**
   * Business logic: Check if rule applies to project
   */
  appliesToProject(projectId) {
    // If projectId is null, rule applies to all projects in org
    if (this.projectId === null) return true;
    return this.projectId === projectId;
  }

  /**
   * Convert to plain object (for serialization)
   */
  toPlainObject() {
    return {
      id: this.id,
      orgId: this.orgId,
      projectId: this.projectId,
      role: this.role,
      resource: this.resource,
      permissionActions: this.permissionActions,
      owner: this.owner,
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
    return new ACLRule(data);
  }
}

