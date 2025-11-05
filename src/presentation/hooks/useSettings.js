import { useState, useEffect, useCallback } from 'react';
import {
  getSettingsUseCase,
  saveSettingsUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';

/**
 * Custom Hook: useSettings
 * Quản lý state và operations cho Settings
 */
export function useSettings(key) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!key) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getSettingsUseCase.execute(key);
      setSettings(result);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err.message);
      toast.error('Lỗi tải cài đặt: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [key]);

  // Save settings
  const saveSettings = useCallback(async (data, user) => {
    if (!key) {
      throw new Error('Settings key is required');
    }

    try {
      setSaving(true);
      setError(null);
      const result = await saveSettingsUseCase.execute(key, data, user);
      setSettings(result);
      toast.success('Cài đặt đã được lưu thành công!');
      return result;
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
      toast.error('Lỗi lưu cài đặt: ' + err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [key]);

  // Load on mount and when key changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    saving,
    error,
    loadSettings,
    saveSettings,
    refresh: loadSettings
  };
}

