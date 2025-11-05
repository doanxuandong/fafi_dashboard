import { useState, useEffect, useCallback } from 'react';
import {
  listStockBalancesUseCase,
  createStockBalanceUseCase,
  updateStockBalanceUseCase,
  deleteStockBalanceUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useStockBalances
 * Quản lý state và operations cho Stock Balances
 */
export function useStockBalances({ accessibleProjectIds = '*', projectId = null, orgId = null } = {}) {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load balances
  const loadBalances = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listStockBalancesUseCase.execute({
        ...filters,
        accessibleProjectIds,
        projectId,
        orgId
      });
      setBalances(result);
    } catch (err) {
      console.error('Error loading stock balances:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách tồn kho: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [accessibleProjectIds, projectId, orgId]);

  // Create balance
  const createBalance = useCallback(async (balanceData, user) => {
    try {
      const newBalance = await createStockBalanceUseCase.execute(balanceData, user);
      await loadBalances(); // Reload list
      toast.success('Đã tạo tồn kho thành công!');
      return newBalance;
    } catch (err) {
      console.error('Error creating stock balance:', err);
      toast.error('Lỗi tạo tồn kho: ' + err.message);
      throw err;
    }
  }, [loadBalances]);

  // Update balance
  const updateBalance = useCallback(async (id, balanceData, user) => {
    try {
      const updatedBalance = await updateStockBalanceUseCase.execute(id, balanceData, user);
      await loadBalances(); // Reload list
      toast.success('Đã cập nhật tồn kho thành công!');
      return updatedBalance;
    } catch (err) {
      console.error('Error updating stock balance:', err);
      toast.error('Lỗi cập nhật tồn kho: ' + err.message);
      throw err;
    }
  }, [loadBalances]);

  // Delete balance
  const deleteBalance = useCallback(async (id) => {
    const confirmed = await confirm('Xóa tồn kho này?');
    if (!confirmed) return;

    try {
      await deleteStockBalanceUseCase.execute(id);
      await loadBalances(); // Reload list
      toast.success('Đã xóa tồn kho thành công!');
    } catch (err) {
      console.error('Error deleting stock balance:', err);
      toast.error('Lỗi xóa tồn kho: ' + err.message);
      throw err;
    }
  }, [loadBalances]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  return {
    balances,
    loading,
    error,
    loadBalances,
    createBalance,
    updateBalance,
    deleteBalance,
    refresh: loadBalances
  };
}

