import { collection, getDocs, setDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'locations_members';

/**
 * Get all members of a location
 */
export async function getLocationMembers(locationId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('locationId', '==', locationId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get all locations a user is assigned to
 */
export async function getUserLocations(userId) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Add user to location
 */
export async function addUserToLocation(userId, locationId, projectId, orgId, locationInfo = {}) {
  const colRef = collection(db, COLLECTION);
  // Since locationId now has format projectId_code, we can use locationId_userId
  const memberId = `${locationId}_${userId}`;
  const memberRef = doc(colRef, memberId);
  
  // Generate keywords from location info for search
  const keywords = [];
  if (locationInfo.code) keywords.push(locationInfo.code.toLowerCase());
  if (locationInfo.name) {
    const nameWords = locationInfo.name.toLowerCase().split(/\s+/);
    nameWords.forEach(word => keywords.push(word));
  }
  if (locationInfo.address) {
    const addressWords = locationInfo.address.toLowerCase().split(/\s+/);
    addressWords.forEach(word => keywords.push(word));
  }
  
  const memberData = {
    id: memberId,
    locationId,
    userId,
    projectId,
    orgId,
    keywords: Array.from(new Set(keywords)),
    createdAt: serverTimestamp()
  };
  
  await setDoc(memberRef, memberData);
  return { id: memberId, ...memberData };
}

/**
 * Remove user from location
 */
export async function removeUserFromLocation(userId, locationId, projectId) {
  const colRef = collection(db, COLLECTION);
  // Since locationId now has format projectId_code, we can use locationId_userId
  const memberId = `${locationId}_${userId}`;
  const memberRef = doc(colRef, memberId);
  await deleteDoc(memberRef);
}

/**
 * Get users by their IDs
 */
export async function getUsersByIds(userIds) {
  if (!userIds || userIds.length === 0) return [];
  
  const { getDoc } = await import('firebase/firestore');
  const usersRef = collection(db, 'users');
  const users = [];
  
  for (const userId of userIds) {
    try {
      const userDoc = await getDoc(doc(usersRef, userId));
      if (userDoc.exists()) {
        users.push({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
    }
  }
  
  return users;
}

