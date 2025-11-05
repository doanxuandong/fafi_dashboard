import { useState, useEffect, useCallback } from 'react';
import {
  listPremiumsUseCase,
  createPremiumUseCase,
  updatePremiumUseCase,
  deletePremiumUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: usePremiums
 * Quản lý state và operations cho Premiums
 */
export function usePremiums({ accessibleProjectIds = '*', projectId = null } = {}) {
  const [premiums, setPremiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load premiums
  const loadPremiums = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listPremiumsUseCase.execute({
        ...filters,
        accessibleProjectIds,
        projectId
      });
      setPremiums(result);
    } catch (err) {
      console.error('Error loading premiums:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách quà tặng: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [accessibleProjectIds, projectId]);

  // Create premium
  const createPremium = useCallback(async (premiumData, user) => {
    try {
      const newPremium = await createPremiumUseCase.execute(premiumData, user);
      await loadPremiums(); // Reload list
      toast.success('Đã tạo quà tặng thành công!');
      return newPremium;
    } catch (err) {
      console.error('Error creating premium:', err);
      toast.error('Lỗi tạo quà tặng: ' + err.message);
      throw err;
    }
  }, [loadPremiums]);

  // Update premium
  const updatePremium = useCallback(async (id, premiumData, user) => {
    try {
      const updatedPremium = await updatePremiumUseCase.execute(id, premiumData, user);
      await loadPremiums(); // Reload list
      toast.success('Đã cập nhật quà tặng thành công!');
      return updatedPremium;
    } catch (err) {
      console.error('Error updating premium:', err);
      toast.error('Lỗi cập nhật quà tặng: ' + err.message);
      throw err;
    }
  }, [loadPremiums]);

  // Delete premium
  const deletePremium = useCallback(async (id) => {
    const confirmed = await confirm('Xóa quà tặng này?');
    if (!confirmed) return;

    try {
      await deletePremiumUseCase.execute(id);
      await loadPremiums(); // Reload list
      toast.success('Đã xóa quà tặng thành công!');
    } catch (err) {
      console.error('Error deleting premium:', err);
      toast.error('Lỗi xóa quà tặng: ' + err.message);
      throw err;
    }
  }, [loadPremiums]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadPremiums();
  }, [loadPremiums]);

  return {
    premiums,
    loading,
    error,
    loadPremiums,
    createPremium,
    updatePremium,
    deletePremium,
    refresh: loadPremiums
  };
}

