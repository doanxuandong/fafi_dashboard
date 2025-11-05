import { Sale } from '../../entities/Sale.js';

/**
 * Use Case: Update Sale
 */
export class UpdateSaleUseCase {
  constructor(salesRepository) {
    this.salesRepository = salesRepository;
  }

  async execute(id, saleData, user) {
    // Get existing sale
    const existing = await this.salesRepository.getSaleById(id);
    if (!existing) {
      throw new Error('Sale not found');
    }

    // Create Domain Entity with updated data
    const sale = Sale.fromPlainObject({
      ...existing,
      ...saleData
    });

    // Business validation
    sale.validate();

    // Auto-recalculate totals if buyProducts changed
    if (saleData.buyProducts) {
      sale.totalAmount = sale.calculateTotalAmount();
      sale.totalQuantity = sale.calculateTotalQuantity();
    }

    // Auto-update keywords if relevant fields changed
    const relevantFields = ['buyerName', 'buyerPhone', 'notes', 'otpCode'];
    if (relevantFields.some(field => saleData[field] !== undefined)) {
      sale.keywords = sale.generateKeywords();
    }

    // Update via repository
    const updatedSale = await this.salesRepository.updateSale(
      id,
      sale.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (updatedSale instanceof Sale) {
      return updatedSale;
    }
    return Sale.fromPlainObject(updatedSale);
  }
}

