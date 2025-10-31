import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'locations';

export async function listLocations({ projectId, orgId, search = '', accessibleProjectIds = null } = {}) {
  const colRef = collection(db, COLLECTION);
  let q = query(colRef, orderBy('updatedAt', 'desc'));
  
  // Filter by projectId if provided
  if (projectId) {
    q = query(colRef, where('projectId', '==', projectId), orderBy('updatedAt', 'desc'));
  }
  
  // Filter by orgId if provided
  if (orgId) {
    q = query(colRef, where('orgId', '==', orgId), orderBy('updatedAt', 'desc'));
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
    (i.code || '').toLowerCase().includes(normalized)
  );
}

export async function createLocation(data, user) {
  const colRef = collection(db, COLLECTION);
  // Generate doc ID first
  const docRef = doc(collection(db, COLLECTION));
  const id = docRef.id;
  
  const payload = {
    id,
    ...data,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    keywords: data.keywords || generateKeywords(data.name, data.code),
    // Ensure required fields have defaults
    status: data.status || 'sitecheck',
    level: data.level || 0,
    availableStock: data.availableStock !== undefined ? data.availableStock : true,
    isInsession: data.isInsession || data.isInSession || false,
    photos: data.photos || [],
    tags: data.tags || [],
    userIds: data.userIds || [user?.uid || 'system'],
    projectIds: data.projectIds || [],
    workingShift: data.workingShift || [],
    workingDates: data.workingDates || [],
    salePromoterPostionPhotos: data.salePromoterPostionPhotos || [],
    posmPostionPhotos: data.posmPostionPhotos || [],
    productDisplayPostionPhotos: data.productDisplayPostionPhotos || [],
    meta: data.meta || {},
    locationMark: data.locationMark || {},
    geoPoint: data.geoPoint || null,
    lastCheckInAt: null,
    lastCheckOutAt: null,
    lastWorkingSessionId: null,
    locationName: data.name,
    parentId: data.parentId || null,
    warehouseProperties: data.warehouseProperties || null,
  };
  
  await setDoc(docRef, payload);
  return { id, ...payload };
}

export async function updateLocation(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    ...(data.name ? { keywords: generateKeywords(data.name, data.code) } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

export async function deleteLocation(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

export function generateKeywords(name = '', code = '') {
  const keywords = new Set();
  
  // Add code as keyword
  if (code) {
    keywords.add(code.toLowerCase());
  }
  
  // Add name keywords
  if (name) {
    const nameWords = name.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    nameWords.forEach(word => {
      // Add full word
      keywords.add(word);
      // Add partial words for search
      for (let i = 1; i <= word.length; i++) {
        keywords.add(word.slice(0, i));
      }
    });
  }
  
  return Array.from(keywords);
}

// Helper function to create default LocationMark
export function createDefaultLocationMark() {
  return {
    region: null,
    province: null,
    district: null,
    ward: null,
    address: '',
    formattedAddress: ''
  };
}

// Helper function to create default WarehouseProperties
export function createDefaultWarehouseProperties() {
  return {
    level: 0,
    parentId: null,
    area: null,
    capacity: null,
    metadata: {}
  };
}
