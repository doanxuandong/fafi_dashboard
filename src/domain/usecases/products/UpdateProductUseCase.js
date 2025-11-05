import { Product } from '../../entities/Product.js';

/**
 * Use Case: Update Product
 */
export class UpdateProductUseCase {
  constructor(productsRepository) {
    this.productsRepository = productsRepository;
  }

  async execute(id, productData, user) {
    // Get existing product
    const existing = await this.productsRepository.getProductById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    // Create Domain Entity with updated data
    const product = Product.fromPlainObject({
      ...existing,
      ...productData
    });

    // Business validation
    product.validate();

    // Auto-update keywords if relevant fields changed
    const relevantFields = ['name', 'code', 'brandFamilyCode'];
    if (relevantFields.some(field => productData[field] !== undefined)) {
      product.keywords = product.generateKeywords();
    }

    // Update via repository
    const updatedProduct = await this.productsRepository.updateProduct(
      id,
      product.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (updatedProduct instanceof Product) {
      return updatedProduct;
    }
    return Product.fromPlainObject(updatedProduct);
  }
}

