import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'sessions';

export async function listSessions({ projectId, locationId, search = '' } = {}) {
  const colRef = collection(db, COLLECTION);
  let q = query(colRef, orderBy('createdAt', 'desc'));
  
  if (projectId) {
    q = query(colRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  }
  
  if (locationId) {
    q = query(colRef, where('locationId', '==', locationId), orderBy('createdAt', 'desc'));
  }
  
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  if (!search) return items;
  const normalized = search.toLowerCase();
  return items.filter(i => 
    (i.keywords || []).some(k => k.includes(normalized)) || 
    (i.locationName || '').toLowerCase().includes(normalized) ||
    (i.notes || '').toLowerCase().includes(normalized)
  );
}

export async function createSession(data, user) {
  const docRef = doc(collection(db, COLLECTION));
  const id = docRef.id;
  
  const payload = {
    id,
    ...data,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    keywords: data.keywords || generateKeywords(data.locationName, data.notes),
    saleProducts: data.saleProducts || [],
    salePremiums: data.salePremiums || [],
    checkInPhotos: data.checkInPhotos || [],
    checkOutPhotos: data.checkOutPhotos || [],
    meta: data.meta || {},
  };
  
  await setDoc(docRef, payload);
  return { id, ...payload };
}

export async function updateSession(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    ...(data.locationName ? { keywords: generateKeywords(data.locationName, data.notes) } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

export async function deleteSession(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

export function generateKeywords(locationName = '', notes = '') {
  const keywords = new Set();
  const text = `${locationName} ${notes}`.toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  words.forEach(word => {
    keywords.add(word);
    for (let i = 1; i <= word.length; i++) {
      keywords.add(word.slice(0, i));
    }
  });
  return Array.from(keywords);
}

