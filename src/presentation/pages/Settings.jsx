import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, MapPin, Users } from 'lucide-react';
import { getSettingsByKey, saveSettingsByKey } from '../../infrastructure/repositories/settingsRepository';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/common/Toaster';

export default function Settings() {
  const { isAdminAppUser } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [settings, setSettings] = useState({
    // General settings
    companyName: 'Mondelez International',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi',
    dateFormat: 'DD/MM/YYYY',
    
    // GPS settings
    gpsAlertDistance: 200,
    gpsUpdateInterval: 30,
    gpsTrackingEnabled: true,
    
    // Notification settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationFrequency: 'immediate',
    
    // Security settings
    sessionTimeout: 30,
    passwordPolicy: 'strong',
    twoFactorAuth: false,
    faceIdRequired: true,
    
    // Training settings
    trainingFrequency: 'daily',
    roleplayRequired: true,
    testPassingScore: 80,
    autoReminder: true,
  });

  // Load settings from Firestore
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const doc = await getSettingsByKey('webGeneral');
        if (mounted && doc) {
          setSettings(prev => ({ ...prev, ...doc }));
        }
        setLoadError(null);
      } catch (e) {
        console.error('Failed to load settings', e);
        setLoadError('Không tải được cài đặt.');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveSettingsByKey('webGeneral', settings);
      toast.success('Cài đặt đã được lưu thành công!');
    } catch (e) {
      console.error('Failed to save settings', e);
      toast.error('Lưu cài đặt thất bại!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
        <p className="text-gray-600">Quản lý cài đặt và cấu hình hệ thống</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'general'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4 inline mr-2" />
                  Tổng quan
                </button>
                <button
                  onClick={() => setActiveTab('gps')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'gps'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="w-4 h-4 inline mr-2" />
                  GPS Tracking
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Bell className="w-4 h-4 inline mr-2" />
                  Thông báo
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'security'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Bảo mật
                </button>
                <button
                  onClick={() => setActiveTab('training')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'training'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Training
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Settings content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {activeTab === 'general' && 'Cài đặt tổng quan'}
                {activeTab === 'gps' && 'Cài đặt GPS Tracking'}
                {activeTab === 'notifications' && 'Cài đặt thông báo'}
                {activeTab === 'security' && 'Cài đặt bảo mật'}
                {activeTab === 'training' && 'Cài đặt training'}
              </h2>
            </div>
            
            <div className="p-6">
              {loading && (
                <div className="text-sm text-gray-500">Đang tải cài đặt...</div>
              )}
              {loadError && (
                <div className="text-sm text-red-600 mb-3">{loadError}</div>
              )}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên công ty
                    </label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => handleSettingChange('companyName', e.target.value)}
                      disabled={!isAdminAppUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Múi giờ
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        disabled={!isAdminAppUser}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                        <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                        <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngôn ngữ
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        disabled={!isAdminAppUser}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Định dạng ngày tháng
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                      disabled={!isAdminAppUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'gps' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Bật GPS Tracking</h3>
                      <p className="text-sm text-gray-500">Theo dõi vị trí nhân viên trong giờ làm việc</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.gpsTrackingEnabled}
                        onChange={(e) => handleSettingChange('gpsTrackingEnabled', e.target.checked)}
                        disabled={!isAdminAppUser}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[' '] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Khoảng cách cảnh báo (mét)
                    </label>
                    <input
                      type="number"
                      value={settings.gpsAlertDistance}
                      onChange={(e) => handleSettingChange('gpsAlertDistance', parseInt(e.target.value))}
                      disabled={!isAdminAppUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">Nhân viên rời khỏi vị trí làm việc bao nhiêu mét sẽ nhận cảnh báo</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tần suất cập nhật vị trí (giây)
                    </label>
                    <input
                      type="number"
                      value={settings.gpsUpdateInterval}
                      onChange={(e) => handleSettingChange('gpsUpdateInterval', parseInt(e.target.value))}
                      disabled={!isAdminAppUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">Tần suất cập nhật vị trí GPS của nhân viên</p>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Email notifications</h3>
                        <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                          disabled={!isAdminAppUser}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[' '] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">SMS notifications</h3>
                        <p className="text-sm text-gray-500">Nhận thông báo qua SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.smsNotifications}
                          onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                          disabled={!isAdminAppUser}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[' '] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Push notifications</h3>
                        <p className="text-sm text-gray-500">Nhận thông báo push trên thiết bị</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.pushNotifications}
                          onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                          disabled={!isAdminAppUser}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[' '] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tần suất thông báo
                    </label>
                    <select
                      value={settings.notificationFrequency}
                      onChange={(e) => handleSettingChange('notificationFrequency', e.target.value)}
                      disabled={!isAdminAppUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="immediate">Ngay lập tức</option>
                      <option value="hourly">Hàng giờ</option>
                      <option value="daily">Hàng ngày</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian timeout phiên (phút)
                    </label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      disabled={!isAdminAppUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chính sách mật khẩu
                    </label>
                    <select
                      value={settings.passwordPolicy}
                      onChange={(e) => handleSettingChange('passwordPolicy', e.target.value)}
                      disabled={!isAdminAppUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="basic">Cơ bản (6 ký tự)</option>
                      <option value="medium">Trung bình (8 ký tự, có số)</option>
                      <option value="strong">Mạnh (8+ ký tự, có số, ký tự đặc biệt)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Xác thực 2 yếu tố</h3>
                        <p className="text-sm text-gray-500">Yêu cầu mã OTP khi đăng nhập</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.twoFactorAuth}
                          onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                          disabled={!isAdminAppUser}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[' '] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Bắt buộc Face ID</h3>
                        <p className="text-sm text-gray-500">Yêu cầu đăng ký Face ID cho tất cả nhân viên</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.faceIdRequired}
                          onChange={(e) => handleSettingChange('faceIdRequired', e.target.checked)}
                          disabled={!isAdminAppUser}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[' '] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'training' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tần suất training
                    </label>
                    <select
                      value={settings.trainingFrequency}
                      onChange={(e) => handleSettingChange('trainingFrequency', e.target.value)}
                      disabled={!isAdminAppUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="daily">Hàng ngày</option>
                      <option value="weekly">Hàng tuần</option>
                      <option value="monthly">Hàng tháng</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Điểm đạt yêu cầu
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.testPassingScore}
                      onChange={(e) => handleSettingChange('testPassingScore', parseInt(e.target.value))}
                      disabled={!isAdminAppUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">Điểm tối thiểu để vượt qua bài test</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Bắt buộc roleplay</h3>
                        <p className="text-sm text-gray-500">Yêu cầu nhân viên upload video roleplay</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.roleplayRequired}
                          onChange={(e) => handleSettingChange('roleplayRequired', e.target.checked)}
                          disabled={!isAdminAppUser}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[' '] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Tự động nhắc nhở</h3>
                        <p className="text-sm text-gray-500">Gửi thông báo nhắc nhở training</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoReminder}
                          onChange={(e) => handleSettingChange('autoReminder', e.target.checked)}
                          disabled={!isAdminAppUser}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[' '] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={!isAdminAppUser || saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

