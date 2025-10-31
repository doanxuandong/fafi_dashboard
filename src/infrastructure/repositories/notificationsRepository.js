import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'notifications';

// Tạo thông báo mới
export async function createNotification(data, user) {
  const colRef = collection(db, COLLECTION);
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    read: false,
    readAt: null,
    readBy: null
  };
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

// Kiểm tra thông báo đã tồn tại chưa
export async function checkNotificationExists(userId, type, itemId) {
  const colRef = collection(db, COLLECTION);
  const q = query(
    colRef,
    where('createdBy', '==', userId),
    where('type', '==', type),
    where('itemId', '==', itemId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// Lấy danh sách thông báo của user
export async function listNotifications(userId) {
  try {
    const colRef = collection(db, COLLECTION);
    // Tạm thời bỏ orderBy để tránh lỗi index
    const q = query(
      colRef,
      where('createdBy', '==', userId)
    );
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort manually để tránh lỗi index
    return notifications.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime; // Descending order
    });
  } catch (error) {
    console.error('Error listing notifications:', error);
    return [];
  }
}

// Lấy thông báo chưa đọc
export async function listUnreadNotifications(userId) {
  try {
    const colRef = collection(db, COLLECTION);
    // Tạm thời bỏ orderBy để tránh lỗi index
    const q = query(
      colRef,
      where('createdBy', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort manually để tránh lỗi index
    return notifications.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime; // Descending order
    });
  } catch (error) {
    console.error('Error listing unread notifications:', error);
    return [];
  }
}

// Đánh dấu đã đọc
export async function markNotificationAsRead(notificationId, userId) {
  const ref = doc(db, COLLECTION, notificationId);
  await updateDoc(ref, {
    read: true,
    readAt: serverTimestamp(),
    readBy: userId
  });
  return { id: notificationId, read: true };
}

// Đánh dấu tất cả đã đọc
export async function markAllNotificationsAsRead(userId) {
  const unreadNotifications = await listUnreadNotifications(userId);
  const promises = unreadNotifications.map(notif => 
    markNotificationAsRead(notif.id, userId)
  );
  await Promise.all(promises);
  return { markedCount: unreadNotifications.length };
}

// Xóa thông báo
export async function deleteNotification(notificationId) {
  const ref = doc(db, COLLECTION, notificationId);
  await deleteDoc(ref);
  return { id: notificationId, deleted: true };
}

// Xóa tất cả thông báo đã đọc
export async function deleteReadNotifications(userId) {
  const notifications = await listNotifications(userId);
  const readNotifications = notifications.filter(notif => notif.read);
  const promises = readNotifications.map(notif => 
    deleteNotification(notif.id)
  );
  await Promise.all(promises);
  return { deletedCount: readNotifications.length };
}

// Tạo thông báo từ dữ liệu hệ thống
export async function createSystemNotification(type, data, userId) {
  const notificationData = {
    type,
    title: data.title,
    message: data.message,
    category: data.category,
    itemId: data.itemId,
    page: data.page,
    tab: data.tab,
    metadata: data.metadata || {},
    systemGenerated: true
  };
  
  return await createNotification(notificationData, { uid: userId });
}
