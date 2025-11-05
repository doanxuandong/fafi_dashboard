import { useState, useEffect, useCallback } from 'react';
import {
  listAclsUseCase,
  createAclRuleUseCase,
  updateAclRuleUseCase,
  deleteAclRuleUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useACLs
 * Quản lý state và operations cho ACL Rules
 */
export function useACLs({ orgId, projectId } = {}) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load ACL rules
  const loadAcls = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listAclsUseCase.execute({
        ...filters,
        orgId,
        projectId
      });
      setRules(result);
    } catch (err) {
      console.error('Error loading ACL rules:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách quy tắc phân quyền: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, projectId]);

  // Create ACL rule
  const createRule = useCallback(async (ruleData, user) => {
    try {
      const newRule = await createAclRuleUseCase.execute(ruleData, user);
      await loadAcls(); // Reload list
      toast.success('Đã tạo quy tắc phân quyền thành công!');
      return newRule;
    } catch (err) {
      console.error('Error creating ACL rule:', err);
      toast.error('Lỗi tạo quy tắc phân quyền: ' + err.message);
      throw err;
    }
  }, [loadAcls]);

  // Update ACL rule
  const updateRule = useCallback(async (id, ruleData, user) => {
    try {
      const updatedRule = await updateAclRuleUseCase.execute(id, ruleData, user);
      await loadAcls(); // Reload list
      toast.success('Đã cập nhật quy tắc phân quyền thành công!');
      return updatedRule;
    } catch (err) {
      console.error('Error updating ACL rule:', err);
      toast.error('Lỗi cập nhật quy tắc phân quyền: ' + err.message);
      throw err;
    }
  }, [loadAcls]);

  // Delete ACL rule
  const deleteRule = useCallback(async (id) => {
    const confirmed = await confirm('Xóa rule này?');
    if (!confirmed) return;

    try {
      await deleteAclRuleUseCase.execute(id);
      await loadAcls(); // Reload list
      toast.success('Đã xóa quy tắc phân quyền thành công!');
    } catch (err) {
      console.error('Error deleting ACL rule:', err);
      toast.error('Lỗi xóa quy tắc phân quyền: ' + err.message);
      throw err;
    }
  }, [loadAcls]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadAcls();
  }, [loadAcls]);

  return {
    rules,
    loading,
    error,
    loadAcls,
    createRule,
    updateRule,
    deleteRule,
    refresh: loadAcls
  };
}

