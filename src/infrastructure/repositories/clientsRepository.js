import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'clients';

export async function listClients({ orgId, search = '' } = {}) {
  const colRef = collection(db, COLLECTION);
  let q = query(colRef, orderBy('createdAt', 'desc'));
  
  if (orgId) {
    q = query(colRef, where('orgId', '==', orgId), orderBy('createdAt', 'desc'));
  }
  
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  if (!search) return items;
  const normalized = search.toLowerCase();
  return items.filter(i => 
    (i.keywords || []).some(k => k.includes(normalized)) || 
    (i.name || '').toLowerCase().includes(normalized)
  );
}

export async function createClient(data, user) {
  const docRef = doc(collection(db, COLLECTION));
  const id = docRef.id;
  
  const payload = {
    id,
    ...data,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    keywords: data.keywords || generateKeywords(data.name),
    photos: data.photos || [],
    tags: data.tags || [],
  };
  
  await setDoc(docRef, payload);
  return { id, ...payload };
}

export async function updateClient(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    ...(data.name ? { keywords: generateKeywords(data.name) } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

export async function deleteClient(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

export function generateKeywords(name = '') {
  const keywords = new Set();
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


