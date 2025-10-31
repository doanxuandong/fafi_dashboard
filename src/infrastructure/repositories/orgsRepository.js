import { collection, getDocs, doc, setDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'orgs';

export async function listOrgs() {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
}

export async function createOrg(data, user) {
  const colRef = collection(db, COLLECTION);
  // Generate doc ID first
  const docRef = doc(collection(db, COLLECTION));
  const id = docRef.id;
  
  const payload = {
    id,
    ...data,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    keywords: data.keywords || generateKeywords(data.name),
  };
  
  await setDoc(docRef, payload);
  return { id, ...payload };
}

export function generateKeywords(text = '') {
  const t = (text || '').toLowerCase().trim();
  const parts = t.split(/\s+/);
  const result = new Set();
  for (const part of parts) {
    for (let i = 1; i <= part.length; i++) {
      result.add(part.slice(0, i));
    }
  }
  result.add(t);
  return Array.from(result);
}


