import { useState, useEffect, useCallback } from 'react';
import {
  listSchedulesUseCase,
  createScheduleUseCase,
  updateScheduleUseCase,
  deleteScheduleUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useSchedules
 * Quản lý state và operations cho Schedules
 */
export function useSchedules({ accessibleProjectIds = '*', projectId = null } = {}) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load schedules
  const loadSchedules = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listSchedulesUseCase.execute({
        ...filters,
        accessibleProjectIds,
        projectId
      });
      setSchedules(result);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách lịch làm việc: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [accessibleProjectIds, projectId]);

  // Create schedule
  const createSchedule = useCallback(async (scheduleData, user) => {
    try {
      const newSchedule = await createScheduleUseCase.execute(scheduleData, user);
      await loadSchedules(); // Reload list
      toast.success('Đã tạo lịch làm việc thành công!');
      return newSchedule;
    } catch (err) {
      console.error('Error creating schedule:', err);
      toast.error('Lỗi tạo lịch làm việc: ' + err.message);
      throw err;
    }
  }, [loadSchedules]);

  // Update schedule
  const updateSchedule = useCallback(async (id, scheduleData, user) => {
    try {
      const updatedSchedule = await updateScheduleUseCase.execute(id, scheduleData, user);
      await loadSchedules(); // Reload list
      toast.success('Đã cập nhật lịch làm việc thành công!');
      return updatedSchedule;
    } catch (err) {
      console.error('Error updating schedule:', err);
      toast.error('Lỗi cập nhật lịch làm việc: ' + err.message);
      throw err;
    }
  }, [loadSchedules]);

  // Delete schedule
  const deleteSchedule = useCallback(async (id) => {
    const confirmed = await confirm('Xóa lịch làm việc này?');
    if (!confirmed) return;

    try {
      await deleteScheduleUseCase.execute(id);
      await loadSchedules(); // Reload list
      toast.success('Đã xóa lịch làm việc thành công!');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      toast.error('Lỗi xóa lịch làm việc: ' + err.message);
      throw err;
    }
  }, [loadSchedules]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  return {
    schedules,
    loading,
    error,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refresh: loadSchedules
  };
}

