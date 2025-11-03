import { 
  collection, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'projects_locations';

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

// List all project-location relationships
export async function listProjectsLocations({ projectId = null, locationId = null } = {}) {
  const colRef = collection(db, COLLECTION);
  let q = colRef; // Default: no filter
  
  // Filter by projectId if provided
  if (projectId) {
    q = query(colRef, where('projectId', '==', projectId));
  }
  
  // Filter by locationId if provided
  if (locationId) {
    q = query(colRef, where('locationId', '==', locationId));
  }
  
  const snapshot = await getDocs(q);
  let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Sort by createdAt descending in memory (to avoid index requirement)
  items.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
  
  return items;
}

// Create new project-location relationship
export async function createProjectLocation(data, user) {
  const colRef = collection(db, COLLECTION);
  
  // Generate unique ID: projectId_locationId
  const docId = `${data.projectId}_${data.locationId}`;
  const docRef = doc(colRef, docId);
  
  const payload = {
    projectId: data.projectId,
    locationId: data.locationId,
    orgId: data.orgId || '',
    keywords: generateKeywords(data.locationName || data.locationId),
    createdAt: serverTimestamp(),
    createdBy: user?.uid || 'system',
  };
  
  await setDoc(docRef, payload);
  return { id: docRef.id, ...payload };
}

// Delete project-location relationship
export async function deleteProjectLocation(projectId, locationId) {
  const docId = `${projectId}_${locationId}`;
  const docRef = doc(db, COLLECTION, docId);
  await deleteDoc(docRef);
  return docId;
}

// Get locations by project
export async function getLocationsByProject(projectId) {
  return await listProjectsLocations({ projectId });
}

// Get projects by location
export async function getProjectsByLocation(locationId) {
  return await listProjectsLocations({ locationId });
}

// Check if project-location relationship exists
export async function projectLocationExists(projectId, locationId) {
  const docId = `${projectId}_${locationId}`;
  const docRef = doc(db, COLLECTION, docId);
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('__name__', '==', docId)));
  return !snapshot.empty;
}

