import { collection, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'projects';

export async function listProjects({ orgId, search = '', accessibleProjectIds } = {}) {
  const colRef = collection(db, COLLECTION);
  let q;
  if (orgId) {
    // Tránh yêu cầu composite index: chỉ where theo orgId
    q = query(colRef, where('orgId', '==', orgId));
  } else {
    q = query(colRef, orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Filter by accessibleProjectIds if provided
  if (accessibleProjectIds && accessibleProjectIds !== '*') {
    const setIds = new Set(accessibleProjectIds);
    items = items.filter(i => setIds.has(i.id));
  }
  if (!search) return items;
  const normalized = search.toLowerCase();
  return items.filter(i => (i.keywords || []).some(k => k.includes(normalized)) || (i.name || '').toLowerCase().includes(normalized));
}

export async function getProjectById(id) {
  if (!id) return null;
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createProject(data, user) {
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
    userIds: [user?.uid || 'system'], // Tự động lấy từ thông tin đăng nhập
  };
  
  await setDoc(docRef, payload);
  return { id, ...payload };
}

export async function updateProject(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    ...(data.name ? { keywords: generateKeywords(data.name) } : {}),
    // Không thay đổi userIds khi update, giữ nguyên như ban đầu
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

export async function deleteProject(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
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


