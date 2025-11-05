import { useCallback } from 'react';
import {
  getProjectMembersUseCase,
  getOrgMembersUseCase,
  addUserToProjectUseCase,
  addUserToOrgUseCase,
  membersRepositoryAdapter
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';

/**
 * Custom Hook: useMembers
 * Quản lý operations cho Members
 */
export function useMembers() {
  // Get project members
  const getProjectMembers = useCallback(async (projectId) => {
    try {
      return await getProjectMembersUseCase.execute(projectId);
    } catch (err) {
      console.error('Error getting project members:', err);
      toast.error('Lỗi lấy danh sách thành viên dự án: ' + err.message);
      throw err;
    }
  }, []);

  // Get org members
  const getOrgMembers = useCallback(async (orgId) => {
    try {
      return await getOrgMembersUseCase.execute(orgId);
    } catch (err) {
      console.error('Error getting org members:', err);
      toast.error('Lỗi lấy danh sách thành viên tổ chức: ' + err.message);
      throw err;
    }
  }, []);

  // Add user to project
  const addUserToProject = useCallback(async (userId, projectId, orgId, role, tags, currentUserId) => {
    try {
      const result = await addUserToProjectUseCase.execute(userId, projectId, orgId, role, tags, currentUserId);
      toast.success('Đã thêm nhân sự vào dự án thành công!');
      return result;
    } catch (err) {
      console.error('Error adding user to project:', err);
      toast.error('Lỗi thêm nhân sự vào dự án: ' + err.message);
      throw err;
    }
  }, []);

  // Add user to org
  const addUserToOrg = useCallback(async (userId, orgId, role, tags, currentUserId) => {
    try {
      const result = await addUserToOrgUseCase.execute(userId, orgId, role, tags, currentUserId);
      toast.success('Đã thêm nhân sự vào tổ chức thành công!');
      return result;
    } catch (err) {
      console.error('Error adding user to org:', err);
      toast.error('Lỗi thêm nhân sự vào tổ chức: ' + err.message);
      throw err;
    }
  }, []);

  // Remove user from project
  const removeUserFromProject = useCallback(async (userId, projectId) => {
    try {
      await membersRepositoryAdapter.removeUserFromProject(userId, projectId);
      toast.success('Đã xóa nhân sự khỏi dự án thành công!');
    } catch (err) {
      console.error('Error removing user from project:', err);
      toast.error('Lỗi xóa nhân sự khỏi dự án: ' + err.message);
      throw err;
    }
  }, []);

  // Remove user from org
  const removeUserFromOrg = useCallback(async (userId, orgId) => {
    try {
      await membersRepositoryAdapter.removeUserFromOrg(userId, orgId);
      toast.success('Đã xóa nhân sự khỏi tổ chức thành công!');
    } catch (err) {
      console.error('Error removing user from org:', err);
      toast.error('Lỗi xóa nhân sự khỏi tổ chức: ' + err.message);
      throw err;
    }
  }, []);

  // Additional helper methods
  const getUsersByIds = useCallback(async (userIds) => {
    return await membersRepositoryAdapter.getUsersByIds(userIds);
  }, []);

  const getUserOrgs = useCallback(async (userId) => {
    return await membersRepositoryAdapter.getUserOrgs(userId);
  }, []);

  const getUserProjects = useCallback(async (userId) => {
    return await membersRepositoryAdapter.getUserProjects(userId);
  }, []);

  return {
    getProjectMembers,
    getOrgMembers,
    addUserToProject,
    addUserToOrg,
    removeUserFromProject,
    removeUserFromOrg,
    getUsersByIds,
    getUserOrgs,
    getUserProjects
  };
}

