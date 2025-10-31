import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'stock_transactions';

// Helper function to generate keywords for search
function generateKeywords(text) {
  if (!text) return [];
  const words = text.toLowerCase().split(/\s+/);
  const keywords = [];
  
  // Add full text
  keywords.push(text.toLowerCase());
  
  // Add individual words
  words.forEach(word => {
    if (word.length > 0) {
      keywords.push(word);
    }
  });
  
  // Add partial words (for better search)
  words.forEach(word => {
    for (let i = 1; i < word.length; i++) {
      keywords.push(word.substring(0, i));
    }
  });
  
  return [...new Set(keywords)]; // Remove duplicates
}

// List all stock transactions
export async function listStockTransactions() {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List stock transactions by project
export async function listStockTransactionsByProject(projectId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List stock transactions by organization
export async function listStockTransactionsByOrg(orgId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('orgId', '==', orgId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List stock transactions by warehouse
export async function listStockTransactionsByWarehouse(warehouseId) {
  const colRef = collection(db, COLLECTION);
  const q = query(
    colRef, 
    where('fromWarehouseId', '==', warehouseId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List stock transactions by status
export async function listStockTransactionsByStatus(status) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('status', '==', status), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Create new stock transaction
export async function createStockTransaction(data, user) {
  const colRef = collection(db, COLLECTION);
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    createdByUserId: user?.uid || 'system',
    keywords: generateKeywords(data.notes || ''),
    status: data.status || 'pending',
    // Ensure arrays are properly formatted
    assetIds: data.assetIds || [],
    items: data.items || [],
  };
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

// Update stock transaction
export async function updateStockTransaction(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    ...(data.notes ? { keywords: generateKeywords(data.notes) } : {}),
    // Ensure arrays are properly formatted
    ...(data.assetIds ? { assetIds: data.assetIds } : {}),
    ...(data.items ? { items: data.items } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

// Delete stock transaction
export async function deleteStockTransaction(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
  return id;
}

// Get stock transaction by ID
export async function getStockTransactionById(id) {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('__name__', '==', id)));
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// Get transaction status color
export function getTransactionStatusColor(status) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Get transaction status text
export function getTransactionStatusText(status) {
  switch (status) {
    case 'completed':
      return 'Hoàn thành';
    case 'pending':
      return 'Chờ xử lý';
    case 'cancelled':
      return 'Đã hủy';
    case 'in_progress':
      return 'Đang xử lý';
    default:
      return 'Không xác định';
  }
}

// Calculate total quantity in transaction
export function calculateTransactionTotalQuantity(transaction) {
  if (!transaction || !transaction.items || !Array.isArray(transaction.items)) return 0;
  return transaction.items.reduce((total, item) => {
    return total + (item.quantity || 0);
  }, 0);
}

// Get transaction summary by status
export function getTransactionSummaryByStatus(transactions) {
  if (!transactions || !Array.isArray(transactions)) {
    return { completed: 0, pending: 0, cancelled: 0, in_progress: 0 };
  }
  
  return transactions.reduce((summary, transaction) => {
    const status = transaction.status || 'unknown';
    summary[status] = (summary[status] || 0) + 1;
    return summary;
  }, { completed: 0, pending: 0, cancelled: 0, in_progress: 0 });
}

// Get recent transactions (last 30 days)
export function getRecentTransactions(transactions, days = 30) {
  if (!transactions || !Array.isArray(transactions)) return [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return transactions.filter(transaction => {
    if (!transaction.createdAt) return false;
    const createdAt = transaction.createdAt.seconds ? 
      new Date(transaction.createdAt.seconds * 1000) : 
      new Date(transaction.createdAt);
    return createdAt >= cutoffDate;
  });
}
