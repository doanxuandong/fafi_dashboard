import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'products';

export async function listProducts({ projectId, clientId, search = '', accessibleProjectIds = null } = {}) {
  const colRef = collection(db, COLLECTION);
  let q = query(colRef, orderBy('createdAt', 'desc'));
  
  if (projectId) {
    q = query(colRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  }
  
  if (clientId) {
    q = query(colRef, where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
  }
  
  const snapshot = await getDocs(q);
  let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Filter by accessible projects if provided
  if (accessibleProjectIds !== null && accessibleProjectIds !== '*') {
    items = items.filter(item => accessibleProjectIds.includes(item.projectId));
  }
  
  if (!search) return items;
  const normalized = search.toLowerCase();
  return items.filter(i => 
    (i.keywords || []).some(k => k.includes(normalized)) || 
    (i.name || '').toLowerCase().includes(normalized) ||
    (i.code || '').toLowerCase().includes(normalized) ||
    (i.brandFamilyCode || '').toLowerCase().includes(normalized)
  );
}

export async function createProduct(data, user) {
  const colRef = collection(db, COLLECTION);
  const docRef = doc(collection(db, COLLECTION));
  const id = docRef.id;
  
  const payload = {
    id,
    ...data,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    keywords: data.keywords || generateKeywords(data.name, data.code),
    available: data.available !== undefined ? data.available : true,
    unitQty: data.unitQty || 0,
    soldUnitQty: data.soldUnitQty || 0,
    photos: data.photos || [],
    tags: data.tags || [],
  };
  
  await setDoc(docRef, payload);
  return { id, ...payload };
}

export async function updateProduct(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    ...(data.name ? { keywords: generateKeywords(data.name, data.code) } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

export async function deleteProduct(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

export function generateKeywords(name = '', code = '') {
  const keywords = new Set();
  
  if (code) keywords.add(code.toLowerCase());
  
  if (name) {
    const nameWords = name.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    nameWords.forEach(word => {
      keywords.add(word);
      for (let i = 1; i <= word.length; i++) {
        keywords.add(word.slice(0, i));
      }
    });
  }
  
  return Array.from(keywords);
}

