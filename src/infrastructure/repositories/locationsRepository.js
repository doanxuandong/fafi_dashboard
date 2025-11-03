import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { createProjectLocation, deleteProjectLocation, projectLocationExists } from './projectsLocationsRepository';

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
  
  // Generate ID based on projectId and code
  let id;
  if (data.projectId && data.code) {
    // Use projectId_code format
    id = `${data.projectId}_${data.code}`;
  } else {
    // Fallback to auto-generated ID if projectId or code is missing
    const tempDocRef = doc(collection(db, COLLECTION));
    id = tempDocRef.id;
  }
  
  // Create document reference with the generated ID
  const docRef = doc(colRef, id);
  
  // Remove address from top level if exists (use locationMark.address instead)
  const { address, ...cleanData } = data;
  
  const payload = {
    id,
    ...cleanData,
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
  
  // Create corresponding entry in projects_locations if projectId exists
  if (data.projectId && data.orgId) {
    try {
      const exists = await projectLocationExists(data.projectId, id);
      if (!exists) {
        await createProjectLocation({
          projectId: data.projectId,
          locationId: id,
          orgId: data.orgId,
          locationName: data.name
        }, user);
      }
    } catch (error) {
      console.error('Error creating project-location relationship:', error);
      // Don't fail the location creation if this fails
    }
  }
  
  return { id, ...payload };
}

export async function updateLocation(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  
  // Remove address from top level if exists (use locationMark.address instead)
  const { address, ...cleanData } = data;
  
  const payload = {
    ...cleanData,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    ...(data.name ? { keywords: generateKeywords(data.name, data.code) } : {}),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

export async function deleteLocation(id, projectId = null) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
  
  // Delete corresponding entries in projects_locations if projectId is provided
  if (projectId) {
    try {
      await deleteProjectLocation(projectId, id);
    } catch (error) {
      console.error('Error deleting project-location relationship:', error);
      // Don't fail the location deletion if this fails
    }
  }
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
