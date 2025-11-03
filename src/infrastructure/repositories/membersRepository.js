import { collection, getDocs, getDoc, setDoc, updateDoc, doc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * ORG MEMBERS MANAGEMENT
 */

// Get all members of an organization
export async function getOrgMembers(orgId) {
  const orgsMembersRef = collection(db, 'orgs_members');
  const q = query(orgsMembersRef, where('orgId', '==', orgId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Get all organizations a user belongs to
export async function getUserOrgs(userId) {
  const orgsMembersRef = collection(db, 'orgs_members');
  const q = query(orgsMembersRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Add user to organization
export async function addUserToOrg(userId, orgId, role, policies = [], createdBy) {
  const orgsMembersRef = collection(db, 'orgs_members');
  const memberId = `${userId}_${orgId}`;
  const memberRef = doc(orgsMembersRef, memberId);
  
  const memberData = {
    orgId,
    userId,
    role: role || 'promoter',
    policies: policies || [],
    createdBy: createdBy || userId,
    createdAt: serverTimestamp()
  };
  
  await setDoc(memberRef, memberData);
  
  // Sync to users collection
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const orgIds = userData.orgIds || [];
    if (!orgIds.includes(orgId)) {
      await updateDoc(userRef, { orgIds: [...orgIds, orgId] });
    }
  }
  
  return { id: memberId, ...memberData };
}

// Remove user from organization
export async function removeUserFromOrg(userId, orgId) {
  const orgsMembersRef = collection(db, 'orgs_members');
  const memberId = `${userId}_${orgId}`;
  const memberRef = doc(orgsMembersRef, memberId);
  await deleteDoc(memberRef);
  
  // Sync to users collection
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const orgIds = (userData.orgIds || []).filter(id => id !== orgId);
    await updateDoc(userRef, { orgIds });
  }
}

/**
 * PROJECT MEMBERS MANAGEMENT
 */

// Get all members of a project
export async function getProjectMembers(projectId) {
  const projectsMembersRef = collection(db, 'projects_members');
  const q = query(projectsMembersRef, where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Get all members of a project in a specific org
export async function getProjectMembersInOrg(orgId, projectId) {
  const projectsMembersRef = collection(db, 'projects_members');
  const q = query(
    projectsMembersRef, 
    where('orgId', '==', orgId),
    where('projectId', '==', projectId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Get all projects a user has access to
export async function getUserProjects(userId) {
  const projectsMembersRef = collection(db, 'projects_members');
  const q = query(projectsMembersRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Get all projects a user has access to in a specific org
export async function getUserProjectsInOrg(userId, orgId) {
  const projectsMembersRef = collection(db, 'projects_members');
  const q = query(
    projectsMembersRef,
    where('userId', '==', userId),
    where('orgId', '==', orgId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Add user to project
export async function addUserToProject(userId, projectId, orgId, role, policies = [], createdBy) {
  const projectsMembersRef = collection(db, 'projects_members');
  const memberId = `${userId}_${projectId}`;
  const memberRef = doc(projectsMembersRef, memberId);
  
  const memberData = {
    orgId,
    userId,
    projectId,
    role: role || 'promoter',
    policies: policies || [],
    createdBy: createdBy || userId,
    createdAt: serverTimestamp()
  };
  
  await setDoc(memberRef, memberData);
  
  // Sync to users collection
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const projectIds = userData.projectIds || [];
    if (!projectIds.includes(projectId)) {
      await updateDoc(userRef, { projectIds: [...projectIds, projectId] });
    }
  }
  
  return { id: memberId, ...memberData };
}

// Remove user from project
export async function removeUserFromProject(userId, projectId) {
  const projectsMembersRef = collection(db, 'projects_members');
  const memberId = `${userId}_${projectId}`;
  const memberRef = doc(projectsMembersRef, memberId);
  await deleteDoc(memberRef);
  
  // Sync to users collection
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const projectIds = (userData.projectIds || []).filter(id => id !== projectId);
    await updateDoc(userRef, { projectIds });
  }
}

// Batch add users to org
export async function batchAddUsersToOrg(userIdOrgDataArray) {
  const batch = [];
  const { collection, setDoc, doc, serverTimestamp } = await import('firebase/firestore');
  
  for (const { userId, orgId, role, policies, createdBy } of userIdOrgDataArray) {
    if (!userId || !orgId) continue;
    const orgsMembersRef = collection(db, 'orgs_members');
    const memberId = `${userId}_${orgId}`;
    const memberRef = doc(orgsMembersRef, memberId);
    
    const memberData = {
      orgId,
      userId,
      role: role || 'promoter',
      policies: policies || [],
      createdBy: createdBy || userId,
      createdAt: serverTimestamp()
    };
    
    batch.push(setDoc(memberRef, memberData));
  }
  
  await Promise.all(batch);
}

// Batch add users to project
export async function batchAddUsersToProject(userIdProjectDataArray) {
  const batch = [];
  const { collection, setDoc, doc, serverTimestamp } = await import('firebase/firestore');
  
  for (const { userId, projectId, orgId, role, policies, createdBy } of userIdProjectDataArray) {
    if (!userId || !projectId || !orgId) continue;
    const projectsMembersRef = collection(db, 'projects_members');
    const memberId = `${userId}_${projectId}`;
    const memberRef = doc(projectsMembersRef, memberId);
    
    const memberData = {
      orgId,
      userId,
      projectId,
      role: role || 'promoter',
      policies: policies || [],
      createdBy: createdBy || userId,
      createdAt: serverTimestamp()
    };
    
    batch.push(setDoc(memberRef, memberData));
  }
  
  await Promise.all(batch);
}

/**
 * UTILITY FUNCTIONS
 */

// Get users by their IDs
export async function getUsersByIds(userIds) {
  if (!userIds || userIds.length === 0) return [];
  
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
