/**
 * Repository Interface for Sales (Domain Layer)
 */
export class ISalesRepository {
  async listSales(filters = {}) {
    throw new Error('Not implemented - this is an interface');
  }

  async getSaleById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async createSale(saleData, user, userName) {
    throw new Error('Not implemented - this is an interface');
  }

  async updateSale(id, saleData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async deleteSale(id) {
    throw new Error('Not implemented - this is an interface');
  }
}

