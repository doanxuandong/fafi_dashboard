import { useState, useEffect, useCallback } from 'react';
import {
  listStockAssetsUseCase,
  createStockAssetUseCase,
  updateStockAssetUseCase,
  deleteStockAssetUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useStockAssets
 * Quản lý state và operations cho Stock Assets
 */
export function useStockAssets({ accessibleProjectIds = '*', projectId = null, orgId = null } = {}) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load assets
  const loadAssets = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listStockAssetsUseCase.execute({
        ...filters,
        accessibleProjectIds,
        projectId,
        orgId
      });
      setAssets(result);
    } catch (err) {
      console.error('Error loading stock assets:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách tài sản kho: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [accessibleProjectIds, projectId, orgId]);

  // Create asset
  const createAsset = useCallback(async (assetData, user) => {
    try {
      const newAsset = await createStockAssetUseCase.execute(assetData, user);
      await loadAssets(); // Reload list
      toast.success('Đã tạo tài sản kho thành công!');
      return newAsset;
    } catch (err) {
      console.error('Error creating stock asset:', err);
      toast.error('Lỗi tạo tài sản kho: ' + err.message);
      throw err;
    }
  }, [loadAssets]);

  // Update asset
  const updateAsset = useCallback(async (id, assetData, user) => {
    try {
      const updatedAsset = await updateStockAssetUseCase.execute(id, assetData, user);
      await loadAssets(); // Reload list
      toast.success('Đã cập nhật tài sản kho thành công!');
      return updatedAsset;
    } catch (err) {
      console.error('Error updating stock asset:', err);
      toast.error('Lỗi cập nhật tài sản kho: ' + err.message);
      throw err;
    }
  }, [loadAssets]);

  // Delete asset
  const deleteAsset = useCallback(async (id) => {
    const confirmed = await confirm('Xóa tài sản kho này?');
    if (!confirmed) return;

    try {
      await deleteStockAssetUseCase.execute(id);
      await loadAssets(); // Reload list
      toast.success('Đã xóa tài sản kho thành công!');
    } catch (err) {
      console.error('Error deleting stock asset:', err);
      toast.error('Lỗi xóa tài sản kho: ' + err.message);
      throw err;
    }
  }, [loadAssets]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  return {
    assets,
    loading,
    error,
    loadAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    refresh: loadAssets
  };
}

