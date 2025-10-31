import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { listStockBalances } from '../../infrastructure/repositories/stockBalancesRepository';
import { listSchedules } from '../../infrastructure/repositories/schedulesRepository';
import { listSales } from '../../infrastructure/repositories/salesRepository';
import { 
  listNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  createSystemNotification,
  checkNotificationExists
} from '../../infrastructure/repositories/notificationsRepository';

const NotificationContext = createContext({});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [highlightedItem, setHighlightedItem] = useState(null);
  const [readNotifications, setReadNotifications] = useState(new Set());

  // Load notifications from Firebase
  const loadNotifications = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Loading notifications for user:', currentUser.uid);
      const firebaseNotifications = await listNotifications(currentUser.uid);
      console.log('Loaded notifications:', firebaseNotifications);
      
      setNotifications(firebaseNotifications);
      
      const unreadCount = firebaseNotifications.filter(notif => !notif.read).length;
      setUnreadCount(unreadCount);
      
      console.log('Unread count:', unreadCount);
    } catch (error) {
      console.error('Error loading notifications from Firebase:', error);
    }
  };

  const generateNotifications = async () => {
    if (!currentUser) return;

    try {
      console.log('Generating notifications...');
      const [balances, schedules, sales] = await Promise.all([
        listStockBalances(),
        listSchedules(),
        listSales()
      ]);
      
      console.log('Loaded data:', { balances: balances.length, schedules: schedules.length, sales: sales.length });

      const newNotifications = [];

      // Cảnh báo sản phẩm sắp hết (stock < 10)
      const lowStockItems = balances.filter(balance => balance.unitQty < 10);
      for (const balance of lowStockItems) {
        try {
          // Kiểm tra thông báo đã tồn tại chưa
          const exists = await checkNotificationExists(currentUser.uid, 'warning', balance.id);
          if (!exists) {
            await createSystemNotification('warning', {
              title: 'Sản phẩm sắp hết',
              message: `${balance.assetName || 'Sản phẩm'} tại ${balance.warehouseName || 'Kho'} chỉ còn ${balance.unitQty} ${balance.pack || 'đơn vị'}`,
              category: 'stock',
              itemId: balance.id,
              page: '/stock-management',
              tab: 'balances',
              metadata: {
                balanceId: balance.id,
                assetName: balance.assetName,
                warehouseName: balance.warehouseName,
                unitQty: balance.unitQty,
                pack: balance.pack
              }
            }, currentUser.uid);
          }
        } catch (error) {
          console.error('Error creating low stock notification:', error);
        }
      }

      // Cảnh báo lịch làm việc sắp đến (trong 1 giờ)
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      for (const schedule of schedules) {
        if (schedule.startAt) {
          let startDate;
          if (schedule.startAt.seconds) {
            startDate = new Date(schedule.startAt.seconds * 1000);
          } else if (schedule.startAt.toDate) {
            startDate = schedule.startAt.toDate();
          } else {
            continue;
          }

          if (startDate > now && startDate <= oneHourFromNow) {
            try {
              await createSystemNotification('info', {
                title: 'Lịch làm việc sắp đến',
                message: `Lịch làm việc tại ${schedule.locationName || 'Chưa có tên địa điểm'} bắt đầu lúc ${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
                category: 'schedule',
                itemId: schedule.id,
                page: '/schedules',
                tab: null,
                metadata: {
                  scheduleId: schedule.id,
                  locationName: schedule.locationName,
                  startAt: startDate.toISOString()
                }
              }, currentUser.uid);
            } catch (error) {
              console.error('Error creating schedule notification:', error);
            }
          }
        }
      }

      // Cảnh báo giao dịch bán hàng bất thường (doanh thu cao)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySales = sales.filter(sale => {
        if (!sale.createdAt) return false;
        let saleDate;
        if (sale.createdAt.seconds) {
          saleDate = new Date(sale.createdAt.seconds * 1000);
        } else if (sale.createdAt.toDate) {
          saleDate = sale.createdAt.toDate();
        } else {
          return false;
        }
        return saleDate >= today;
      });

      // Tính tổng doanh thu hôm nay
      const todayRevenue = todaySales.reduce((total, sale) => {
        const buyProducts = sale.buyProducts || [];
        const saleTotal = buyProducts.reduce((sum, product) => {
          return sum + ((product.quantity || 0) * (product.price || 0));
        }, 0);
        return total + saleTotal;
      }, 0);

      // Nếu doanh thu hôm nay > 10,000,000 VND
      if (todayRevenue > 10000000) {
        try {
          await createSystemNotification('success', {
            title: 'Doanh thu cao hôm nay',
            message: `Doanh thu hôm nay đạt ${todayRevenue.toLocaleString('vi-VN')}đ - vượt mục tiêu!`,
            category: 'sales',
            itemId: null,
            page: '/sales',
            tab: null,
            metadata: {
              revenue: todayRevenue,
              date: today.toISOString()
            }
          }, currentUser.uid);
        } catch (error) {
          console.error('Error creating revenue notification:', error);
        }
      }

      // Load lại thông báo từ Firebase sau khi tạo
      await loadNotifications();

    } catch (error) {
      console.error('Error generating notifications:', error);
      // Set empty notifications to prevent crashes
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      
      // Cập nhật trong Firebase
      const result = await markNotificationAsRead(notificationId, currentUser?.uid);
      console.log('Firebase update result:', result);
      
      // Cập nhật local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, readAt: new Date(), readBy: currentUser?.uid }
            : notif
        )
      );
      
      // Cập nhật unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log('Notification marked as read successfully');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Cập nhật trong Firebase
      await markAllNotificationsAsRead(currentUser?.uid);
      
      // Cập nhật local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, readAt: new Date(), readBy: currentUser?.uid }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const highlightItem = (itemId, category) => {
    setHighlightedItem({ itemId, category });
    // Tự động bỏ highlight sau 5 giây
    setTimeout(() => {
      setHighlightedItem(null);
    }, 5000);
  };

  const clearHighlight = () => {
    setHighlightedItem(null);
  };

  useEffect(() => {
    if (currentUser) {
      // Load notifications từ Firebase trước
      loadNotifications();
      
      // Tạo thông báo mới dựa trên dữ liệu hiện tại
      generateNotifications();
      
      // Cập nhật thông báo mỗi 5 phút
      const interval = setInterval(() => {
        generateNotifications();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const value = {
    notifications,
    unreadCount,
    highlightedItem,
    generateNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    highlightItem,
    clearHighlight
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
