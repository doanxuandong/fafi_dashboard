import { Sale } from '../../entities/Sale.js';

/**
 * Use Case: List Sales
 */
export class ListSalesUseCase {
  constructor(salesRepository) {
    this.salesRepository = salesRepository;
  }

  async execute(filters = {}) {
    const sales = await this.salesRepository.listSales(filters);
    
    // Convert to Domain Entities
    return sales.map(s => {
      if (s instanceof Sale) {
        return s;
      }
      return Sale.fromPlainObject(s);
    });
  }
}

