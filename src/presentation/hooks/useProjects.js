import { useState, useEffect, useCallback } from 'react';
import {
  listProjectsUseCase,
  createProjectUseCase,
  updateProjectUseCase,
  deleteProjectUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useProjects
 * Quản lý state và operations cho Projects
 * Presentation layer chỉ sử dụng hook này, không gọi trực tiếp infrastructure
 */
export function useProjects({ accessibleProjectIds = '*', orgId = null } = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load projects
  const loadProjects = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listProjectsUseCase.execute({
        ...filters,
        accessibleProjectIds,
        orgId
      });
      setProjects(result);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách dự án: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [accessibleProjectIds, orgId]);

  // Create project
  const createProject = useCallback(async (projectData, user) => {
    try {
      const newProject = await createProjectUseCase.execute(projectData, user);
      await loadProjects(); // Reload list
      toast.success('Đã tạo dự án thành công!');
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Lỗi tạo dự án: ' + err.message);
      throw err;
    }
  }, [loadProjects]);

  // Update project
  const updateProject = useCallback(async (id, projectData, user) => {
    try {
      const updatedProject = await updateProjectUseCase.execute(id, projectData, user);
      await loadProjects(); // Reload list
      toast.success('Đã cập nhật dự án thành công!');
      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Lỗi cập nhật dự án: ' + err.message);
      throw err;
    }
  }, [loadProjects]);

  // Delete project
  const deleteProject = useCallback(async (id) => {
    const confirmed = await confirm('Xóa dự án này?');
    if (!confirmed) return;

    try {
      await deleteProjectUseCase.execute(id);
      await loadProjects(); // Reload list
      toast.success('Đã xóa dự án thành công!');
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error('Lỗi xóa dự án: ' + err.message);
      throw err;
    }
  }, [loadProjects]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    refresh: loadProjects
  };
}

