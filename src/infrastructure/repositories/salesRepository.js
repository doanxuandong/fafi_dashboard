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

const COLLECTION = 'sales';

// Helper function to generate keywords for search
function generateKeywords(buyerName, buyerPhone, notes, otpCode) {
  const keywords = [];
  const texts = [buyerName, buyerPhone, notes, otpCode].filter(Boolean);
  
  texts.forEach(text => {
    if (!text) return;
    const words = text.toLowerCase().split(/\s+/);
    
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
  });
  
  return [...new Set(keywords)]; // Remove duplicates
}

// List all sales
export async function listSales({ accessibleProjectIds = null } = {}) {
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

// List sales by project
export async function listSalesByProject(projectId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List sales by location
export async function listSalesByLocation(locationId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('locationId', '==', locationId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List sales by session
export async function listSalesBySession(sessionId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('sessionId', '==', sessionId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Create new sale
export async function createSale(data, user, userName) {
  const colRef = collection(db, COLLECTION);
  
  // Calculate totals
  const totalAmount = calculateTotalAmount(data.buyProducts);
  const totalQuantity = calculateTotalQuantity(data.buyProducts);
  
  const payload = {
    id: doc(colRef).id,
    projectId: data.projectId || '',
    buyerId: data.buyerId || null,
    otpCode: data.otpCode || null,
    buyProducts: data.buyProducts || [],
    getPremiums: data.getPremiums || [],
    totalAmount,
    totalQuantity,
    photos: data.photos || [],
    billPhotos: data.billPhotos || [],
    notes: data.notes || null,
    locationId: data.locationId || null,
    locationName: data.locationName || null,
    sessionId: data.sessionId || null,
    keywords: generateKeywords(data.buyerName, data.buyerPhone, data.notes, data.otpCode),
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    createdByName: userName || user?.displayName || null,
    updatedAt: null,
  };
  
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

// Update sale
export async function updateSale(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  
  // Calculate totals
  const totalAmount = calculateTotalAmount(data.buyProducts);
  const totalQuantity = calculateTotalQuantity(data.buyProducts);
  
  const payload = {
    projectId: data.projectId,
    buyerId: data.buyerId || null,
    otpCode: data.otpCode || null,
    buyProducts: data.buyProducts || [],
    getPremiums: data.getPremiums || [],
    totalAmount,
    totalQuantity,
    photos: data.photos || [],
    billPhotos: data.billPhotos || [],
    notes: data.notes || null,
    locationId: data.locationId,
    locationName: data.locationName || null,
    sessionId: data.sessionId || null,
    keywords: generateKeywords(data.buyerName, data.buyerPhone, data.notes, data.otpCode),
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
  };
  
  await updateDoc(ref, payload);
  return { id, ...payload };
}

// Delete sale
export async function deleteSale(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
  return id;
}

// Get sale by ID
export async function getSaleById(id) {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('__name__', '==', id)));
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// Calculate total sales amount
export function calculateTotalAmount(buyProducts) {
  if (!buyProducts || !Array.isArray(buyProducts)) return 0;
  return buyProducts.reduce((total, product) => {
    return total + (product.moneyAmount || 0);
  }, 0);
}

// Calculate total quantity sold
export function calculateTotalQuantity(buyProducts) {
  if (!buyProducts || !Array.isArray(buyProducts)) return 0;
  return buyProducts.reduce((total, product) => {
    return total + (product.qty || 0);
  }, 0);
}
