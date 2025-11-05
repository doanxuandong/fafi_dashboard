import { Sale } from '../../entities/Sale.js';

/**
 * Use Case: Create Sale
 */
export class CreateSaleUseCase {
  constructor(salesRepository) {
    this.salesRepository = salesRepository;
  }

  async execute(saleData, user, userName) {
    // Create Domain Entity
    const sale = new Sale({
      ...saleData,
      createdByName: userName
    });

    // Business validation
    sale.validate();

    // Auto-calculate totals
    sale.totalAmount = sale.calculateTotalAmount();
    sale.totalQuantity = sale.calculateTotalQuantity();

    // Auto-generate keywords if not provided
    if (!sale.keywords || sale.keywords.length === 0) {
      sale.keywords = sale.generateKeywords();
    }

    // Save via repository
    const createdSale = await this.salesRepository.createSale(
      sale.toPlainObject(),
      user,
      userName
    );

    // Return as Domain Entity
    if (createdSale instanceof Sale) {
      return createdSale;
    }
    return Sale.fromPlainObject(createdSale);
  }
}

