import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'premiums';

export async function listPremiums({ projectId, search = '' } = {}) {
  const colRef = collection(db, COLLECTION);
  let q = query(colRef);
  
  if (projectId) {
    q = query(colRef, where('projectId', '==', projectId));
  }
  
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(d => {
    const data = d.data();
    return { 
      id: d.id, 
      ...data,
      // Map fields to match what we need
      name: data.name || '',
      code: data.code || '',
      price: data.price || 0,
      amount: data.amount || 0,
      projectId: data.projectId || '',
      available: data.available !== undefined ? data.available : true,
    };
  });
  
  // Sort by name
  items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  
  if (!search) return items;
  const normalized = search.toLowerCase();
  return items.filter(i => 
    (i.keywords || []).some(k => k.includes(normalized)) || 
    (i.name || '').toLowerCase().includes(normalized) ||
    (i.code || '').toLowerCase().includes(normalized)
  );
}

export async function createPremium(data, user) {
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
    amount: data.amount || 0,
    price: data.price || 0,
    stockIn: data.stockIn || 0,
    stockOut: data.stockOut || 0,
    photos: data.photos || [],
    tags: data.tags || [],
    options: data.options || {},
  };
  
  await setDoc(docRef, payload);
  return { id, ...payload };
}

export async function updatePremium(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    ...(data.name ? { keywords: generateKeywords(data.name, data.code) } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

export async function deletePremium(id) {
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

