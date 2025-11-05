import { useCallback } from 'react';
import {
  getLocationsByProjectUseCase,
  createProjectLocationUseCase,
  deleteProjectLocationUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useProjectsLocations
 * Quản lý operations cho Projects-Locations relationships
 */
export function useProjectsLocations() {
  // Get locations by project
  const getLocationsByProject = useCallback(async (projectId) => {
    try {
      return await getLocationsByProjectUseCase.execute(projectId);
    } catch (err) {
      console.error('Error getting locations by project:', err);
      toast.error('Lỗi lấy danh sách địa điểm: ' + err.message);
      throw err;
    }
  }, []);

  // Create project location
  const createProjectLocation = useCallback(async (data, user) => {
    try {
      const result = await createProjectLocationUseCase.execute(data, user);
      toast.success('Đã phân công địa điểm thành công!');
      return result;
    } catch (err) {
      console.error('Error creating project location:', err);
      toast.error('Lỗi phân công địa điểm: ' + err.message);
      throw err;
    }
  }, []);

  // Delete project location
  const deleteProjectLocation = useCallback(async (projectId, locationId) => {
    const confirmed = await confirm('Bỏ phân công địa điểm này?');
    if (!confirmed) return;

    try {
      await deleteProjectLocationUseCase.execute(projectId, locationId);
      toast.success('Đã bỏ phân công địa điểm thành công!');
    } catch (err) {
      console.error('Error deleting project location:', err);
      toast.error('Lỗi bỏ phân công địa điểm: ' + err.message);
      throw err;
    }
  }, []);

  return {
    getLocationsByProject,
    createProjectLocation,
    deleteProjectLocation
  };
}

