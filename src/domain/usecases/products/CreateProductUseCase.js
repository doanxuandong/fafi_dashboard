import { Product } from '../../entities/Product.js';

/**
 * Use Case: Create Product
 */
export class CreateProductUseCase {
  constructor(productsRepository) {
    this.productsRepository = productsRepository;
  }

  async execute(productData, user) {
    // Create Domain Entity
    const product = new Product(productData);

    // Business validation
    product.validate();

    // Auto-generate keywords if not provided
    if (!product.keywords || product.keywords.length === 0) {
      product.keywords = product.generateKeywords();
    }

    // Save via repository
    const createdProduct = await this.productsRepository.createProduct(
      product.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (createdProduct instanceof Product) {
      return createdProduct;
    }
    return Product.fromPlainObject(createdProduct);
  }
}

