/**
 * Repository Interface for Products (Domain Layer)
 */
export class IProductsRepository {
  async listProducts(filters = {}) {
    throw new Error('Not implemented - this is an interface');
  }

  async getProductById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async createProduct(productData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async updateProduct(id, productData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async deleteProduct(id) {
    throw new Error('Not implemented - this is an interface');
  }
}

