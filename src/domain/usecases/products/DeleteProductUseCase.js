/**
 * Use Case: Delete Product
 */
export class DeleteProductUseCase {
  constructor(productsRepository) {
    this.productsRepository = productsRepository;
  }

  async execute(id) {
    // Check if product exists
    const product = await this.productsRepository.getProductById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Delete via repository
    await this.productsRepository.deleteProduct(id);
  }
}

