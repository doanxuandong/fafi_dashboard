import { useState, useEffect, useCallback } from 'react';
import {
  listSalesUseCase,
  createSaleUseCase,
  updateSaleUseCase,
  deleteSaleUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useSales
 * Quản lý state và operations cho Sales
 */
export function useSales({ accessibleProjectIds = '*', projectId = null, locationId = null } = {}) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load sales
  const loadSales = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listSalesUseCase.execute({
        ...filters,
        accessibleProjectIds,
        projectId,
        locationId
      });
      setSales(result);
    } catch (err) {
      console.error('Error loading sales:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách bán hàng: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [accessibleProjectIds, projectId, locationId]);

  // Create sale
  const createSale = useCallback(async (saleData, user, userName) => {
    try {
      const newSale = await createSaleUseCase.execute(saleData, user, userName);
      await loadSales(); // Reload list
      toast.success('Đã tạo thông tin bán hàng thành công!');
      return newSale;
    } catch (err) {
      console.error('Error creating sale:', err);
      toast.error('Lỗi tạo thông tin bán hàng: ' + err.message);
      throw err;
    }
  }, [loadSales]);

  // Update sale
  const updateSale = useCallback(async (id, saleData, user) => {
    try {
      const updatedSale = await updateSaleUseCase.execute(id, saleData, user);
      await loadSales(); // Reload list
      toast.success('Đã cập nhật thông tin bán hàng thành công!');
      return updatedSale;
    } catch (err) {
      console.error('Error updating sale:', err);
      toast.error('Lỗi cập nhật thông tin bán hàng: ' + err.message);
      throw err;
    }
  }, [loadSales]);

  // Delete sale
  const deleteSale = useCallback(async (id) => {
    const confirmed = await confirm('Xóa thông tin bán hàng này?');
    if (!confirmed) return;

    try {
      await deleteSaleUseCase.execute(id);
      await loadSales(); // Reload list
      toast.success('Đã xóa thông tin bán hàng thành công!');
    } catch (err) {
      console.error('Error deleting sale:', err);
      toast.error('Lỗi xóa thông tin bán hàng: ' + err.message);
      throw err;
    }
  }, [loadSales]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return {
    sales,
    loading,
    error,
    loadSales,
    createSale,
    updateSale,
    deleteSale,
    refresh: loadSales
  };
}

