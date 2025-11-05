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
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'stock_assets';

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

// List all stock assets
export async function listStockAssets({ accessibleProjectIds = null } = {}) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Filter by accessible projects if provided
  if (accessibleProjectIds !== null && accessibleProjectIds !== '*') {
    items = items.filter(item => accessibleProjectIds.includes(item.projectId));
  }
  
  return items;
}

// List stock assets by project
export async function listStockAssetsByProject(projectId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List stock assets by organization
export async function listStockAssetsByOrg(orgId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('orgId', '==', orgId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List available stock assets
export async function listAvailableStockAssets() {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('available', '==', true), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Create new stock asset
export async function createStockAsset(data, user) {
  const colRef = collection(db, COLLECTION);
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    keywords: generateKeywords(data.name || ''),
    available: data.available !== undefined ? data.available : true,
    // Convert dates to Firestore Timestamps
    expDate: data.expDate ? Timestamp.fromDate(new Date(data.expDate)) : null,
    mfgDate: data.mfgDate ? Timestamp.fromDate(new Date(data.mfgDate)) : null,
  };
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

// Update stock asset
export async function updateStockAsset(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    ...(data.name ? { keywords: generateKeywords(data.name) } : {}),
    // Convert dates to Firestore Timestamps
    ...(data.expDate ? { expDate: Timestamp.fromDate(new Date(data.expDate)) } : {}),
    ...(data.mfgDate ? { mfgDate: Timestamp.fromDate(new Date(data.mfgDate)) } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

// Delete stock asset
export async function deleteStockAsset(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
  return id;
}

// Get stock asset by ID
export async function getStockAssetById(id) {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('__name__', '==', id)));
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// Calculate total value of stock assets
export function calculateTotalValue(stockAssets) {
  if (!stockAssets || !Array.isArray(stockAssets)) return 0;
  return stockAssets.reduce((total, asset) => {
    const packQty = asset.packQty || 0;
    const packPrice = asset.packPrice || 0;
    return total + (packQty * packPrice);
  }, 0);
}

// Check if asset is expired
export function isAssetExpired(expDate) {
  if (!expDate) return false;
  const today = new Date();
  const expiryDate = expDate.seconds ? new Date(expDate.seconds * 1000) : new Date(expDate);
  return expiryDate < today;
}

// Get assets expiring soon (within 30 days)
export function getAssetsExpiringSoon(stockAssets, days = 30) {
  if (!stockAssets || !Array.isArray(stockAssets)) return [];
  const today = new Date();
  const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return stockAssets.filter(asset => {
    if (!asset.expDate) return false;
    const expDate = asset.expDate.seconds ? new Date(asset.expDate.seconds * 1000) : new Date(asset.expDate);
    return expDate >= today && expDate <= futureDate;
  });
}
