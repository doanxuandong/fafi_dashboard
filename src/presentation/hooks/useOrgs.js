import { useState, useEffect, useCallback } from 'react';
import {
  listOrgsUseCase,
  createOrgUseCase,
  updateOrgUseCase,
  deleteOrgUseCase,
  orgsRepositoryAdapter
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useOrgs
 * Quản lý state và operations cho Orgs
 */
export function useOrgs() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load orgs
  const loadOrgs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listOrgsUseCase.execute();
      setOrgs(result);
    } catch (err) {
      console.error('Error loading orgs:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách tổ chức: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create org
  const createOrg = useCallback(async (orgData, user) => {
    try {
      const newOrg = await createOrgUseCase.execute(orgData, user);
      await loadOrgs(); // Reload list
      toast.success('Đã tạo tổ chức thành công!');
      return newOrg;
    } catch (err) {
      console.error('Error creating org:', err);
      toast.error('Lỗi tạo tổ chức: ' + err.message);
      throw err;
    }
  }, [loadOrgs]);

  // Update org
  const updateOrg = useCallback(async (id, orgData, user) => {
    try {
      const updatedOrg = await updateOrgUseCase.execute(id, orgData, user);
      await loadOrgs(); // Reload list
      toast.success('Đã cập nhật tổ chức thành công!');
      return updatedOrg;
    } catch (err) {
      console.error('Error updating org:', err);
      toast.error('Lỗi cập nhật tổ chức: ' + err.message);
      throw err;
    }
  }, [loadOrgs]);

  // Delete org
  const deleteOrg = useCallback(async (id) => {
    const confirmed = await confirm('Xóa tổ chức này?');
    if (!confirmed) return;

    try {
      await deleteOrgUseCase.execute(id);
      await loadOrgs(); // Reload list
      toast.success('Đã xóa tổ chức thành công!');
    } catch (err) {
      console.error('Error deleting org:', err);
      toast.error('Lỗi xóa tổ chức: ' + err.message);
      throw err;
    }
  }, [loadOrgs]);

  // Upload org photo
  const uploadOrgPhoto = useCallback(async (orgId, file) => {
    try {
      const photoUrl = await orgsRepositoryAdapter.uploadOrgPhoto(orgId, file);
      return photoUrl;
    } catch (err) {
      console.error('Error uploading org photo:', err);
      toast.error('Lỗi upload ảnh: ' + err.message);
      throw err;
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  return {
    orgs,
    loading,
    error,
    loadOrgs,
    createOrg,
    updateOrg,
    deleteOrg,
    uploadOrgPhoto,
    refresh: loadOrgs
  };
}

