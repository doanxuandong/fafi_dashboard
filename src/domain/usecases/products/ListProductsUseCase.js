import { Product } from '../../entities/Product.js';

/**
 * Use Case: List Products
 */
export class ListProductsUseCase {
  constructor(productsRepository) {
    this.productsRepository = productsRepository;
  }

  async execute(filters = {}) {
    const products = await this.productsRepository.listProducts(filters);
    
    // Convert to Domain Entities
    return products.map(p => {
      if (p instanceof Product) {
        return p;
      }
      return Product.fromPlainObject(p);
    });
  }
}

