import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';

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
    name: data.name || '',
    code: data.code || null,
    description: data.description || null,
    photoUrls: data.photoUrls || [],
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    keywords: data.keywords || generateKeywords(data.name),
  };
  
  await setDoc(docRef, payload);
  return { id, ...payload };
}

export async function updateOrg(id, data, user) {
  const docRef = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
  };
  if (data.name) {
    payload.keywords = generateKeywords(data.name);
  }
  await updateDoc(docRef, payload);
  return { id, ...payload };
}

export async function uploadOrgPhoto(orgId, file) {
  try {
    const timestamp = Date.now();
    const fileName = `fafi_image_${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `orgs/${orgId}/photos/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading org photo:', error);
    throw error;
  }
}

export async function deleteOrg(id) {
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
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

