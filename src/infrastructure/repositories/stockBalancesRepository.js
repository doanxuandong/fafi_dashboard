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

const COLLECTION = 'stock_balances';

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

// List all stock balances
export async function listStockBalances({ accessibleProjectIds = null } = {}) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Filter by accessible projects if provided
  if (accessibleProjectIds !== null && accessibleProjectIds !== '*') {
    items = items.filter(item => accessibleProjectIds.includes(item.projectId));
  }
  
  return items;
}

// List stock balances by project
export async function listStockBalancesByProject(projectId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('projectId', '==', projectId), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List stock balances by warehouse
export async function listStockBalancesByWarehouse(warehouseId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('warehouseId', '==', warehouseId), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List stock balances by organization
export async function listStockBalancesByOrg(orgId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('orgId', '==', orgId), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get stock balance by asset and warehouse
export async function getStockBalanceByAssetAndWarehouse(assetId, warehouseId) {
  const colRef = collection(db, COLLECTION);
  const q = query(
    colRef, 
    where('assetId', '==', assetId), 
    where('warehouseId', '==', warehouseId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// Create new stock balance
export async function createStockBalance(data, user) {
  const colRef = collection(db, COLLECTION);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    keywords: generateKeywords(data.assetName || ''),
    // Ensure numeric values are properly set
    unitQty: data.unitQty || 0,
    inboundUnitQty: data.inboundUnitQty || 0,
    outboundUnitQty: data.outboundUnitQty || 0,
    bookedUnitQty: data.bookedUnitQty || 0,
    shrinkageUnitQty: data.shrinkageUnitQty || 0,
  };
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

// Update stock balance
export async function updateStockBalance(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    ...(data.assetName ? { keywords: generateKeywords(data.assetName) } : {}),
    // Ensure numeric values are properly set
    ...(data.unitQty !== undefined ? { unitQty: data.unitQty } : {}),
    ...(data.inboundUnitQty !== undefined ? { inboundUnitQty: data.inboundUnitQty } : {}),
    ...(data.outboundUnitQty !== undefined ? { outboundUnitQty: data.outboundUnitQty } : {}),
    ...(data.bookedUnitQty !== undefined ? { bookedUnitQty: data.bookedUnitQty } : {}),
    ...(data.shrinkageUnitQty !== undefined ? { shrinkageUnitQty: data.shrinkageUnitQty } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

// Delete stock balance
export async function deleteStockBalance(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
  return id;
}

// Get stock balance by ID
export async function getStockBalanceById(id) {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('__name__', '==', id)));
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// Calculate total stock value
export function calculateTotalStockValue(stockBalances, stockAssets) {
  if (!stockBalances || !Array.isArray(stockBalances) || !stockAssets || !Array.isArray(stockAssets)) return 0;
  
  return stockBalances.reduce((total, balance) => {
    const asset = stockAssets.find(a => a.id === balance.assetId);
    if (!asset) return total;
    
    const unitPrice = asset.unitPrice || 0;
    const unitQty = balance.unitQty || 0;
    return total + (unitPrice * unitQty);
  }, 0);
}

// Calculate available stock (unitQty - bookedUnitQty)
export function calculateAvailableStock(balance) {
  if (!balance) return 0;
  const unitQty = balance.unitQty || 0;
  const bookedUnitQty = balance.bookedUnitQty || 0;
  return Math.max(0, unitQty - bookedUnitQty);
}

// Get low stock items (available stock < threshold)
export function getLowStockItems(stockBalances, threshold = 10) {
  if (!stockBalances || !Array.isArray(stockBalances)) return [];
  
  return stockBalances.filter(balance => {
    const available = calculateAvailableStock(balance);
    return available < threshold;
  });
}

// Get stock movement summary
export function getStockMovementSummary(stockBalances) {
  if (!stockBalances || !Array.isArray(stockBalances)) {
    return { totalInbound: 0, totalOutbound: 0, totalShrinkage: 0, totalBooked: 0 };
  }
  
  return stockBalances.reduce((summary, balance) => {
    return {
      totalInbound: summary.totalInbound + (balance.inboundUnitQty || 0),
      totalOutbound: summary.totalOutbound + (balance.outboundUnitQty || 0),
      totalShrinkage: summary.totalShrinkage + (balance.shrinkageUnitQty || 0),
      totalBooked: summary.totalBooked + (balance.bookedUnitQty || 0),
    };
  }, { totalInbound: 0, totalOutbound: 0, totalShrinkage: 0, totalBooked: 0 });
}
