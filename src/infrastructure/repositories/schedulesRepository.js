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

const COLLECTION = 'schedules';

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

// List all schedules
export async function listSchedules({ accessibleProjectIds = null } = {}) {
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

// List schedules by project
export async function listSchedulesByProject(projectId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// List schedules by location
export async function listSchedulesByLocation(locationId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('locationId', '==', locationId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Create new schedule
export async function createSchedule(data, user) {
  const colRef = collection(db, COLLECTION);
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    keywords: generateKeywords(data.notes || ''),
    active: data.active !== undefined ? data.active : true,
    // Convert datetime strings to Firestore Timestamps
    startAt: data.startAt ? Timestamp.fromDate(new Date(data.startAt)) : null,
    endAt: data.endAt ? Timestamp.fromDate(new Date(data.endAt)) : null,
  };
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

// Update schedule
export async function updateSchedule(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    ...(data.notes ? { keywords: generateKeywords(data.notes) } : {}),
    // Convert datetime strings to Firestore Timestamps
    ...(data.startAt ? { startAt: Timestamp.fromDate(new Date(data.startAt)) } : {}),
    ...(data.endAt ? { endAt: Timestamp.fromDate(new Date(data.endAt)) } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

// Delete schedule
export async function deleteSchedule(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
  return id;
}

// Get schedule by ID
export async function getScheduleById(id) {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('__name__', '==', id)));
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}
