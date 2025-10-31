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
export async function createSale(data, user) {
  const colRef = collection(db, COLLECTION);
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    keywords: generateKeywords(data.notes || ''),
    // Ensure arrays are properly formatted
    buyProducts: data.buyProducts || [],
    getPremiums: data.getPremiums || [],
    billPhotos: data.billPhotos || [],
    photos: data.photos || [],
  };
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

// Update sale
export async function updateSale(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    ...(data.notes ? { keywords: generateKeywords(data.notes) } : {}),
    // Ensure arrays are properly formatted
    ...(data.buyProducts ? { buyProducts: data.buyProducts } : {}),
    ...(data.getPremiums ? { getPremiums: data.getPremiums } : {}),
    ...(data.billPhotos ? { billPhotos: data.billPhotos } : {}),
    ...(data.photos ? { photos: data.photos } : {}),
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
    const quantity = product.quantity || 0;
    const price = product.price || 0;
    return total + (quantity * price);
  }, 0);
}

// Calculate total quantity sold
export function calculateTotalQuantity(buyProducts) {
  if (!buyProducts || !Array.isArray(buyProducts)) return 0;
  return buyProducts.reduce((total, product) => {
    return total + (product.quantity || 0);
  }, 0);
}
