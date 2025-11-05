import { useState, useEffect, useCallback } from 'react';
import {
  listLocationsUseCase,
  createLocationUseCase,
  updateLocationUseCase,
  deleteLocationUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useLocations
 * Quản lý state và operations cho Locations
 */
export function useLocations({ accessibleProjectIds = '*', projectId = null, orgId = null } = {}) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load locations
  const loadLocations = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listLocationsUseCase.execute({
        ...filters,
        accessibleProjectIds,
        projectId,
        orgId
      });
      setLocations(result);
    } catch (err) {
      console.error('Error loading locations:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách địa điểm: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [accessibleProjectIds, projectId, orgId]);

  // Create location
  const createLocation = useCallback(async (locationData, user) => {
    try {
      const newLocation = await createLocationUseCase.execute(locationData, user);
      await loadLocations(); // Reload list
      toast.success('Đã tạo địa điểm thành công!');
      return newLocation;
    } catch (err) {
      console.error('Error creating location:', err);
      toast.error('Lỗi tạo địa điểm: ' + err.message);
      throw err;
    }
  }, [loadLocations]);

  // Update location
  const updateLocation = useCallback(async (id, locationData, user) => {
    try {
      const updatedLocation = await updateLocationUseCase.execute(id, locationData, user);
      await loadLocations(); // Reload list
      toast.success('Đã cập nhật địa điểm thành công!');
      return updatedLocation;
    } catch (err) {
      console.error('Error updating location:', err);
      toast.error('Lỗi cập nhật địa điểm: ' + err.message);
      throw err;
    }
  }, [loadLocations]);

  // Delete location
  const deleteLocation = useCallback(async (id) => {
    const confirmed = await confirm('Xóa địa điểm này?');
    if (!confirmed) return;

    try {
      await deleteLocationUseCase.execute(id);
      await loadLocations(); // Reload list
      toast.success('Đã xóa địa điểm thành công!');
    } catch (err) {
      console.error('Error deleting location:', err);
      toast.error('Lỗi xóa địa điểm: ' + err.message);
      throw err;
    }
  }, [loadLocations]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  return {
    locations,
    loading,
    error,
    loadLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    refresh: loadLocations
  };
}

