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
function generateKeywords(locationName, locationCode, notes) {
  const keywords = [];
  const texts = [locationName, locationCode, notes].filter(Boolean);
  
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

// List all schedules
export async function listSchedules({ accessibleProjectIds = null } = {}) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  // Spread Firestore data first, then assign the canonical document id
  // to avoid any embedded "id" field in the document from overriding doc.id
  let items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  
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
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
}

// List schedules by location
export async function listSchedulesByLocation(locationId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('locationId', '==', locationId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
}

// Create new schedule
export async function createSchedule(data, user) {
  const colRef = collection(db, COLLECTION);
  
  // Extract location code from locationId (format: projectId_code)
  const locationCode = data.locationId ? data.locationId.split('_').pop() : '';
  
  const payload = {
    projectId: data.projectId || '',
    locationId: data.locationId || '',
    locationName: data.locationName || '',
    members: data.members || [],
    notes: data.notes || null,
    active: data.active !== undefined ? data.active : true,
    keywords: generateKeywords(data.locationName, locationCode, data.notes),
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    updatedAt: null,
    // Convert datetime strings to Firestore Timestamps
    startAt: data.startAt ? Timestamp.fromDate(new Date(data.startAt)) : null,
    endAt: data.endAt ? Timestamp.fromDate(new Date(data.endAt)) : null,
  };
  
  const docRef = await addDoc(colRef, payload);
  return { ...payload, id: docRef.id };
}

// Update schedule
export async function updateSchedule(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  
  // Extract location code from locationId (format: projectId_code)
  const locationCode = data.locationId ? data.locationId.split('_').pop() : '';
  
  const payload = {
    projectId: data.projectId,
    locationId: data.locationId,
    locationName: data.locationName,
    members: data.members || [],
    notes: data.notes !== undefined ? data.notes : null,
    active: data.active !== undefined ? data.active : true,
    keywords: generateKeywords(data.locationName, locationCode, data.notes),
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    // Convert datetime strings to Firestore Timestamps
    startAt: data.startAt ? Timestamp.fromDate(new Date(data.startAt)) : null,
    endAt: data.endAt ? Timestamp.fromDate(new Date(data.endAt)) : null,
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
