import { collection, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '../services/firebase';

const COLLECTION = 'users';

export async function listUsers({ search = '', orgId = null, projectId = null, accessibleProjectIds = null } = {}) {
  const colRef = collection(db, COLLECTION);
  let q = query(colRef, orderBy('createdAt', 'desc'));
  
  if (orgId) {
    q = query(colRef, where('orgIds', 'array-contains', orgId), orderBy('createdAt', 'desc'));
  }
  
  if (projectId) {
    q = query(colRef, where('projectIds', 'array-contains', projectId), orderBy('createdAt', 'desc'));
  }
  
  const snapshot = await getDocs(q);
  let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Filter by accessible projects if provided
  if (accessibleProjectIds !== null && accessibleProjectIds !== '*') {
    items = items.filter(item => {
      const userProjectIds = item.projectIds || [];
      return userProjectIds.some(pid => accessibleProjectIds.includes(pid));
    });
  }
  
  if (!search) return items;
  
  const normalized = search.toLowerCase();
  return items.filter(i => 
    (i.keywords || []).some(k => k.includes(normalized)) || 
    (i.displayName || '').toLowerCase().includes(normalized) ||
    (i.email || '').toLowerCase().includes(normalized) ||
    (i.phoneNumber || '').includes(normalized)
  );
}

export async function getUserById(userId) {
  const docRef = doc(db, COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function createUser(data, user) {
  try {
    // Use a secondary app to avoid affecting current auth session
    const secondaryApp = initializeApp(firebaseConfig, 'secondary');
    const secondaryAuth = getAuth(secondaryApp);
    
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        data.email,
        data.password || '123456'
      );
    } catch (authError) {
      await deleteApp(secondaryApp);
      if (authError.code === 'auth/email-already-in-use') {
        throw new Error(`Email ${data.email} đã được sử dụng. Vui lòng chọn email khác.`);
      }
      throw authError;
    }
    
    const uid = userCredential.user.uid;
    
    // Create user document in Firestore
    const docRef = doc(db, COLLECTION, uid);
    const payload = {
      id: uid,
      code: data.code || uid.substring(0, 8), // Generate code from UID if not provided
      email: data.email,
      displayName: data.displayName || '',
      phoneNumber: data.phoneNumber || null, // Use null instead of empty string
      role: data.role || 'staff',
      // Do not prefill orgIds; they will be synced from assigned projects
      orgIds: [],
      projectIds: data.projectIds || [],
      enable: true,
      createdAt: serverTimestamp(),
      createdBy: user?.uid || 'system',
      keywords: generateUserKeywords({
        displayName: data.displayName,
        email: data.email,
        code: data.code || uid.substring(0, 8),
        role: data.role || 'staff',
      }),
      groups: data.groups || [],
      tags: data.tags || [],
      policies: data.policies || [], // Fixed: policies not policy
      locationIds: [],
      members: [],
      appraisalPoints: 0,
      photoUrl: data.photoUrl || null,
      lastOrgId: data.lastOrgId || null,
      lastSignInAt: null,
      lineManager: data.lineManager || null,
      trainedAt: data.trainedAt || null,
    };
    
    await setDoc(docRef, payload);

    // Auto-sync: create orgs_members/projects_members and set lastOrgId for mobile
    if (payload.projectIds && payload.projectIds.length > 0) {
      await assignUserToProjects(uid, payload.projectIds);
    }
    // Clean up secondary app
    await deleteApp(secondaryApp);
    
    return { id: uid, uid, ...payload };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  
  // Get existing user data to preserve email if not provided
  const existingUser = await getUserById(id);
  if (!existingUser) {
    throw new Error('User not found');
  }
  
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || 'system',
    // Ensure phoneNumber is null instead of empty string
    phoneNumber: data.phoneNumber === '' ? null : (data.phoneNumber !== undefined ? data.phoneNumber : existingUser.phoneNumber),
    // Update keywords if relevant fields changed - use existing values if not provided
    ...((data.displayName || data.email || data.code || data.role)
      ? {
          keywords: generateUserKeywords({
            displayName: data.displayName || existingUser.displayName,
            email: data.email || existingUser.email,
            code: data.code || existingUser.code,
            role: data.role || existingUser.role,
          }),
        }
      : {}),
  };
  
  await updateDoc(ref, payload);

  // Auto-sync: whenever projectIds are updated, ensure mobile mappings exist
  if (Object.prototype.hasOwnProperty.call(data, 'projectIds')) {
    await assignUserToProjects(id, data.projectIds || []);
  }

  return { id, ...payload };
}

export async function deleteUser(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

export async function updateLastSignInAt(userId) {
  const ref = doc(db, COLLECTION, userId);
  await updateDoc(ref, { lastSignInAt: serverTimestamp() });
}

export async function assignUserToProjects(userId, projectIds) {
  const ref = doc(db, COLLECTION, userId);
  
  // Get current user data to preserve existing orgIds
  const userDoc = await getDoc(ref);
  const currentUser = userDoc.exists() ? userDoc.data() : {};
  const currentOrgIds = currentUser.orgIds || [];
  
  // Get project details to extract orgIds
  const { getProjectById } = await import('./projectsRepository');
  const projectDetails = await Promise.all(
    (projectIds || []).map(id => getProjectById(id))
  );
  
  // Extract unique orgIds from projects and merge with existing ones
  const newOrgIds = [...new Set(
    projectDetails
      .filter(p => p?.orgId)
      .map(p => p.orgId)
  )];
  
  // Merge with existing orgIds (avoid duplicates)
  const mergedOrgIds = [...new Set([...currentOrgIds, ...newOrgIds])];
  
  // Set lastOrgId to first org if not set (for mobile app compatibility)
  // CRITICAL: Mobile app requires lastOrgId to display projects
  const lastOrgId = currentUser.lastOrgId || newOrgIds[0] || null;
  
  // Update user document
  await updateDoc(ref, {
    projectIds,
    orgIds: mergedOrgIds,
    lastOrgId: lastOrgId,
    updatedAt: serverTimestamp()
  });
  
  // Create records in projects_members collection for mobile app compatibility
  await createProjectsMembersRecords(userId, projectDetails, currentUser);

  // Create records in orgs_users collection so mobile can list organizations
  await createOrgsMembersRecords(userId, mergedOrgIds, currentUser);
}

async function createProjectsMembersRecords(userId, projectDetails, userData) {
  const { collection, setDoc, doc, serverTimestamp } = await import('firebase/firestore');
  const { db } = await import('../services/firebase');
  
  const projectsMembersRef = collection(db, 'projects_members');
  
  // Create a batch for efficient writes
  const batch = [];
  
  for (const project of projectDetails) {
    if (!project?.id || !project?.orgId) continue;
    
    const memberId = `${userId}_${project.id}`;
    const memberRef = doc(projectsMembersRef, memberId);
    
    const memberData = {
      orgId: project.orgId,
      userId: userId,
      projectId: project.id,
      role: userData.role || 'promoter',
      policies: userData.policies || [],
      createdBy: userData.createdBy || userId,
      createdAt: serverTimestamp()
    };
    
    batch.push(setDoc(memberRef, memberData));
  }
  
  // Execute all writes
  await Promise.all(batch);
}

async function createOrgsMembersRecords(userId, orgIds, userData) {
  const { collection, setDoc, doc, serverTimestamp } = await import('firebase/firestore');
  const { db } = await import('../services/firebase');

  const orgsMembersRef = collection(db, 'orgs_members');
  const batch = [];

  for (const orgId of orgIds || []) {
    if (!orgId) continue;
    const memberId = `${userId}_${orgId}`;
    const memberRef = doc(orgsMembersRef, memberId);
    const memberData = {
      orgId,
      userId,
      role: userData.role || 'promoter',
      policies: userData.policies || [],
      createdBy: userData.createdBy || userId,
      createdAt: serverTimestamp(),
    };
    batch.push(setDoc(memberRef, memberData));
  }

  await Promise.all(batch);
}

export async function syncUserOrgIds(userId) {
  const ref = doc(db, COLLECTION, userId);
  const userDoc = await getDoc(ref);
  
  if (!userDoc.exists()) return null;
  
  const user = userDoc.data();
  const projectIds = user.projectIds || [];
  
  if (projectIds.length === 0) return user;
  
  // Get project details to extract orgIds
  const { getProjectById } = await import('./projectsRepository');
  const projectDetails = await Promise.all(
    projectIds.map(id => getProjectById(id))
  );
  
  // Extract unique orgIds from projects
  const orgIds = [...new Set(
    projectDetails
      .filter(p => p?.orgId)
      .map(p => p.orgId)
  )];
  
  // Update user with synced orgIds
  await updateDoc(ref, {
    orgIds,
    updatedAt: serverTimestamp()
  });
  
  return { ...user, orgIds };
}

export async function syncAllUsersOrgIds() {
  const users = await listUsers();
  const results = [];
  
  for (const user of users) {
    try {
      const synced = await syncUserOrgIds(user.id);
      if (synced) results.push(synced);
    } catch (error) {
      console.error(`Failed to sync orgIds for user ${user.id}:`, error);
    }
  }
  
  return results;
}

export async function syncAllUsersProjectsMembers() {
  const users = await listUsers();
  const results = [];
  
  for (const user of users) {
    try {
      if (user.projectIds && user.projectIds.length > 0) {
        const { getProjectById } = await import('./projectsRepository');
        const projectDetails = await Promise.all(
          user.projectIds.map(id => getProjectById(id))
        );
        
        await createProjectsMembersRecords(user.id, projectDetails, user);
        results.push({ userId: user.id, projectsCount: projectDetails.length });
      }
    } catch (error) {
      console.error(`Failed to sync projects_members for user ${user.id}:`, error);
    }
  }
  
  return results;
}

export async function syncAllUsersOrgsMembers() {
  const users = await listUsers();
  const results = [];

  for (const user of users) {
    try {
      const orgIds = user.orgIds || [];
      if (orgIds.length > 0) {
        await createOrgsMembersRecords(user.id, orgIds, user);
        results.push({ userId: user.id, orgsCount: orgIds.length });
      }
    } catch (error) {
      console.error(`Failed to sync orgs_members for user ${user.id}:`, error);
    }
  }

  return results;
}

export async function fixMissingUserFields() {
  const users = await listUsers();
  const results = [];
  
  for (const user of users) {
    try {
      const updates = {};
      
      // Fix missing code field
      if (!user.code) {
        updates.code = user.id.substring(0, 8);
      }
      
      // Fix phoneNumber empty string to null
      if (user.phoneNumber === '') {
        updates.phoneNumber = null;
      }
      
      // Fix policy field name to policies
      if (user.policy && !user.policies) {
        updates.policies = Array.isArray(user.policy) ? user.policy : [];
        updates.policy = undefined; // Remove old field
      }
      
      // Fix missing lastOrgId for mobile app compatibility
      if (!user.lastOrgId && user.orgIds && user.orgIds.length > 0) {
        updates.lastOrgId = user.orgIds[0];
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        const ref = doc(db, COLLECTION, user.id);
        await updateDoc(ref, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        results.push({ userId: user.id, updates });
      }
      
      // Also fix projects_members records if user has projectIds
      if (user.projectIds && user.projectIds.length > 0) {
        const { getProjectById } = await import('./projectsRepository');
        const projectDetails = await Promise.all(
          user.projectIds.map(id => getProjectById(id))
        );
        
        await createProjectsMembersRecords(user.id, projectDetails, user);
        results.push({ userId: user.id, projectsMembersFixed: true });
      }
    } catch (error) {
      console.error(`Failed to fix user ${user.id}:`, error);
    }
  }
  
  return results;
}

export async function fixSpecificUser(userId) {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log('Fixing user:', user.email);
    
    // Fix missing fields
    const updates = {};
    
    if (!user.code) {
      updates.code = user.id.substring(0, 8);
    }
    
    if (user.phoneNumber === '') {
      updates.phoneNumber = null;
    }
    
    if (user.policy && !user.policies) {
      updates.policies = Array.isArray(user.policy) ? user.policy : [];
      updates.policy = undefined;
    }
    
    if (!user.lastOrgId && user.orgIds && user.orgIds.length > 0) {
      updates.lastOrgId = user.orgIds[0];
    }
    
    // Update user if needed
    if (Object.keys(updates).length > 0) {
      const ref = doc(db, COLLECTION, userId);
      await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Updated user fields:', updates);
    }
    
    // Fix projects_members records
    if (user.projectIds && user.projectIds.length > 0) {
      const { getProjectById } = await import('./projectsRepository');
      const projectDetails = await Promise.all(
        user.projectIds.map(id => getProjectById(id))
      );
      
      console.log('Project details:', projectDetails);
      
      await createProjectsMembersRecords(userId, projectDetails, user);
      console.log('Created projects_members records');
    }
    
    return { success: true, userId, updates };
  } catch (error) {
    console.error(`Failed to fix user ${userId}:`, error);
    throw error;
  }
}

export async function checkProjectsMembers(userId) {
  try {
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    const { db } = await import('../services/firebase');
    
    const projectsMembersRef = collection(db, 'projects_members');
    const q = query(projectsMembersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`User ${userId} has ${records.length} projects_members records:`, records);
    return records;
  } catch (error) {
    console.error('Error checking projects_members:', error);
    throw error;
  }
}

export async function debugUserProjects(userId) {
  try {
    console.log('=== DEBUG USER PROJECTS ===');
    
    // 1. Get user profile
    const user = await getUserById(userId);
    console.log('1. User Profile:', {
      id: user?.id,
      email: user?.email,
      displayName: user?.displayName,
      role: user?.role,
      lastOrgId: user?.lastOrgId,
      orgIds: user?.orgIds,
      projectIds: user?.projectIds,
      enable: user?.enable
    });
    
    // 2. Check projects_members records
    const projectsMembers = await checkProjectsMembers(userId);
    console.log('2. Projects Members Records:', projectsMembers);
    
    // 3. Check if projects exist
    if (user?.projectIds?.length > 0) {
      const { getProjectById } = await import('./projectsRepository');
      const projectDetails = await Promise.all(
        user.projectIds.map(id => getProjectById(id))
      );
      console.log('3. Project Details:', projectDetails);
    }
    
    // 4. Check if org exists
    if (user?.lastOrgId) {
      const { getOrgById } = await import('./orgsRepository');
      const org = await getOrgById(user.lastOrgId);
      console.log('4. Last Org Details:', org);
    }
    
    console.log('=== END DEBUG ===');
    
    return {
      user,
      projectsMembers,
      hasLastOrgId: !!user?.lastOrgId,
      hasProjectsMembers: projectsMembers.length > 0,
      hasProjectIds: user?.projectIds?.length > 0
    };
  } catch (error) {
    console.error('Debug error:', error);
    throw error;
  }
}

export async function testProjectsMembersQuery(userId, orgId) {
  try {
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    const { db } = await import('../services/firebase');
    
    console.log('=== TEST PROJECTS MEMBERS QUERY ===');
    console.log('userId:', userId);
    console.log('orgId:', orgId);
    
    const projectsMembersRef = collection(db, 'projects_members');
    
    // Test 1: Query by userId only (like myProjectMemberships)
    console.log('\n1. Query by userId only:');
    const q1 = query(projectsMembersRef, where('userId', '==', userId));
    const snapshot1 = await getDocs(q1);
    const results1 = snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Results:', results1);
    
    // Test 2: Query by orgId and userId (like projectMembershipsInOrg)
    console.log('\n2. Query by orgId and userId:');
    const q2 = query(
      projectsMembersRef, 
      where('orgId', '==', orgId),
      where('userId', '==', userId)
    );
    const snapshot2 = await getDocs(q2);
    const results2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Results:', results2);
    
    // Test 3: Query by orgId only
    console.log('\n3. Query by orgId only:');
    const q3 = query(projectsMembersRef, where('orgId', '==', orgId));
    const snapshot3 = await getDocs(q3);
    const results3 = snapshot3.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Results:', results3);
    
    console.log('=== END TEST ===');
    
    return {
      userIdOnly: results1,
      orgIdAndUserId: results2,
      orgIdOnly: results3
    };
  } catch (error) {
    console.error('Test query error:', error);
    throw error;
  }
}

export async function fixUserLastOrgId(userId) {
  try {
    console.log('=== FIX USER LAST ORG ID ===');
    console.log('userId:', userId);
    
    const userProfile = await getUserById(userId);
    if (!userProfile) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('Current lastOrgId:', userProfile.lastOrgId);
    console.log('Current orgIds:', userProfile.orgIds);
    
    // If lastOrgId is null but orgIds exists, set lastOrgId to first orgId
    if (!userProfile.lastOrgId && userProfile.orgIds && userProfile.orgIds.length > 0) {
      const newLastOrgId = userProfile.orgIds[0];
      console.log('Setting lastOrgId to:', newLastOrgId);
      
      const ref = doc(db, COLLECTION, userId);
      await updateDoc(ref, {
        lastOrgId: newLastOrgId,
    updatedAt: serverTimestamp()
  });
      
      console.log('✅ lastOrgId updated successfully');
      
      // Also ensure projects_members records exist
      if (userProfile.projectIds && userProfile.projectIds.length > 0) {
        console.log('Creating projects_members records...');
        const { getProjectById } = await import('./projectsRepository');
        const projectDetails = await Promise.all(
          userProfile.projectIds.map(id => getProjectById(id))
        );
        
        await createProjectsMembersRecords(userId, projectDetails, userProfile);
        console.log('✅ projects_members records created');
      }
      
      return { success: true, lastOrgId: newLastOrgId };
    } else {
      console.log('✅ lastOrgId already set or no orgIds');
      return { success: false, reason: 'lastOrgId already set or no orgIds' };
    }
    
  } catch (error) {
    console.error('Fix error:', error);
    throw error;
  }
}

export async function checkRootUser() {
  try {
    console.log('=== CHECK ROOT USER ===');
    
    // Tìm user có email root@fafi.app
    const users = await listUsers();
    const rootUser = users.find(u => u.email === 'root@fafi.app');
    
    console.log('All users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
    console.log('Root user found:', rootUser);
    
    if (!rootUser) {
      console.log('❌ Root user not found in Firestore');
      return { exists: false, user: null };
    }
    
    console.log('✅ Root user found:', {
      id: rootUser.id,
      email: rootUser.email,
      role: rootUser.role,
      projectIds: rootUser.projectIds,
      orgIds: rootUser.orgIds,
      lastOrgId: rootUser.lastOrgId
    });
    
    return { exists: true, user: rootUser };
    
  } catch (error) {
    console.error('Error checking root user:', error);
    return { exists: false, user: null, error };
  }
}

export async function createRootUser() {
  try {
    console.log('=== CREATE ROOT USER ===');
    
    // Kiểm tra xem đã có root user chưa
    const { exists } = await checkRootUser();
    if (exists) {
      console.log('✅ Root user already exists');
      return { success: false, reason: 'Root user already exists' };
    }
    
    // Tạo root user
    const rootUserData = {
      email: 'root@fafi.app',
      displayName: 'Root Administrator',
      phoneNumber: null,
      role: 'root',
      password: 'root123456', // Mật khẩu mặc định
      orgIds: [],
      projectIds: [],
      lastOrgId: null
    };
    
    console.log('Creating root user...');
    const newUser = await createUser(rootUserData, { uid: 'system' });
    
    console.log('✅ Root user created successfully:', newUser);
    
    return { success: true, user: newUser };
    
  } catch (error) {
    console.error('Error creating root user:', error);
    return { success: false, error: error.message };
  }
}

export async function resetRootUserPassword() {
  try {
    console.log('=== RESET ROOT USER PASSWORD ===');
    
    // Kiểm tra root user có tồn tại không
    const { exists, user } = await checkRootUser();
    if (!exists) {
      console.log('❌ Root user not found, creating new one...');
      return await createRootUser();
    }
    
    console.log('Root user found, resetting password...');
    
    // Sử dụng Firebase Admin SDK để reset password
    // Hoặc tạo lại user với mật khẩu mới
    const newPassword = 'root123456';
    
    // Tạo secondary app để reset password
    const secondaryApp = initializeApp(firebaseConfig, 'password-reset');
    const secondaryAuth = getAuth(secondaryApp);
    
    try {
      // Thử đăng nhập với mật khẩu cũ để verify user tồn tại
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(secondaryAuth, 'root@fafi.app', 'root123456');
      console.log('✅ Root user can login with current password');
      
      await deleteApp(secondaryApp);
      return { success: true, message: 'Root user password is correct' };
      
    } catch (authError) {
      console.log('❌ Root user cannot login, creating new user...');
      
      // Xóa user cũ trong Firestore
      const ref = doc(db, COLLECTION, user.id);
      await deleteDoc(ref);
      
      // Tạo lại user mới
      const rootUserData = {
        email: 'root@fafi.app',
        displayName: 'Root Administrator',
        phoneNumber: null,
        role: 'root',
        password: newPassword,
        orgIds: [],
        projectIds: [],
        lastOrgId: null
      };
      
      const newUser = await createUser(rootUserData, { uid: 'system' });
      
      await deleteApp(secondaryApp);
      
      console.log('✅ Root user recreated successfully');
      return { success: true, user: newUser, message: 'Root user recreated' };
    }
    
  } catch (error) {
    console.error('Error resetting root user password:', error);
    return { success: false, error: error.message };
  }
}

export async function debugMobileAppIssue(userEmail) {
  try {
    console.log('=== DEBUG MOBILE APP ISSUE ===');
    console.log('User email:', userEmail);
    
    // 1. Tìm user theo email
    const users = await listUsers();
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
      console.log('❌ User not found');
      return { success: false, error: 'User not found' };
    }
    
    console.log('1. User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      orgIds: user.orgIds,
      projectIds: user.projectIds,
      lastOrgId: user.lastOrgId,
      code: user.code,
      policies: user.policies
    });
    
    // 2. Kiểm tra projects_members records
    const projectsMembers = await checkProjectsMembers(user.id);
    console.log('2. Projects members records:', projectsMembers);
    
    // 3. Kiểm tra project details
    if (user.projectIds && user.projectIds.length > 0) {
      const { getProjectById } = await import('./projectsRepository');
      const projectDetails = await Promise.all(
        user.projectIds.map(id => getProjectById(id))
      );
      console.log('3. Project details:', projectDetails);
      
      // 4. Test queries như mobile app
      if (user.orgIds && user.orgIds.length > 0) {
        const testResults = await testProjectsMembersQuery(user.id, user.orgIds[0]);
        console.log('4. Query test results:', testResults);
      }
    }
    
    // 5. Kiểm tra các vấn đề có thể có
    const issues = [];
    
    if (!user.lastOrgId) {
      issues.push('❌ lastOrgId is null - mobile app will show org selection screen');
    }
    
    if (!user.code) {
      issues.push('❌ code field is missing - mobile app will crash');
    }
    
    if (user.policy && !user.policies) {
      issues.push('❌ policy field should be policies');
    }
    
    if (projectsMembers.length === 0) {
      issues.push('❌ No projects_members records - mobile app cannot load projects');
    }
    
    // Kiểm tra orgIds có đúng không
    if (user.projectIds && user.projectIds.length > 0) {
      const { getProjectById } = await import('./projectsRepository');
      const projectDetails = await Promise.all(
        user.projectIds.map(id => getProjectById(id))
      );
      
      const projectOrgIds = projectDetails
        .filter(p => p?.orgId)
        .map(p => p.orgId);
      
      const userOrgIds = user.orgIds || [];
      
      // Kiểm tra xem orgIds có match với project orgIds không
      const missingOrgIds = projectOrgIds.filter(orgId => !userOrgIds.includes(orgId));
      if (missingOrgIds.length > 0) {
        issues.push(`❌ Missing orgIds: ${missingOrgIds.join(', ')}`);
      }
    }
    
    console.log('5. Issues found:', issues);
    
    // 6. Đề xuất sửa chữa
    if (issues.length > 0) {
      console.log('6. Fixing issues...');
      
      // Sửa orgIds trước
      if (user.projectIds && user.projectIds.length > 0) {
        console.log('Fixing orgIds...');
        await assignUserToProjects(user.id, user.projectIds);
      }
      
      // Sau đó sửa các vấn đề khác
      await fixUserLastOrgId(user.id);
      console.log('✅ Applied fixes');
    }
    
    console.log('=== DEBUG COMPLETED ===');
    
    return {
      success: true,
      user,
      projectsMembers,
      issues,
      fixed: issues.length > 0
    };
    
  } catch (error) {
    console.error('Debug error:', error);
    return { success: false, error: error.message };
  }
}

export async function fixSpecificUserMobileIssue(userEmail) {
  try {
    console.log('=== FIX SPECIFIC USER MOBILE ISSUE ===');
    console.log('User email:', userEmail);
    
    // 1. Tìm user theo email
    const users = await listUsers();
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
      console.log('❌ User not found');
      return { success: false, error: 'User not found' };
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      orgIds: user.orgIds,
      projectIds: user.projectIds,
      lastOrgId: user.lastOrgId
    });
    
    // 2. Re-assign projects để sync lại orgIds và projects_members
    if (user.projectIds && user.projectIds.length > 0) {
      console.log('Re-assigning projects to sync orgIds and projects_members...');
      await assignUserToProjects(user.id, user.projectIds);
      console.log('✅ Projects re-assigned successfully');
    }
    
    // 3. Kiểm tra lại sau khi sửa
    const updatedUser = await getUserById(user.id);
    console.log('Updated user:', {
      id: updatedUser.id,
      email: updatedUser.email,
      orgIds: updatedUser.orgIds,
      projectIds: updatedUser.projectIds,
      lastOrgId: updatedUser.lastOrgId
    });
    
    // 4. Kiểm tra projects_members records
    const projectsMembers = await checkProjectsMembers(user.id);
    console.log('Projects members records:', projectsMembers);
    
    // 5. Test queries
    if (updatedUser.orgIds && updatedUser.orgIds.length > 0) {
      const testResults = await testProjectsMembersQuery(user.id, updatedUser.orgIds[0]);
      console.log('Query test results:', testResults);
    }
    
    console.log('=== FIX COMPLETED ===');
    
    return {
      success: true,
      user: updatedUser,
      projectsMembers,
      message: 'User mobile issue fixed successfully'
    };
    
  } catch (error) {
    console.error('Fix error:', error);
    return { success: false, error: error.message };
  }
}

export async function testCreateUserAndAssignProjects() {
  try {
    console.log('=== TEST CREATE USER AND ASSIGN PROJECTS ===');
    
    // Test data
    const testUserData = {
      email: 'test.mobile@fafi.app',
      displayName: 'Test Mobile User',
      phoneNumber: '0123456789',
      role: 'promoter',
      password: '123456'
    };
    
    const testProjectIds = ['4d6e4f3e-2b13-4d60-b606-8d64dfe0b038']; // Replace with actual project ID
    
    console.log('1. Creating test user...');
    const newUser = await createUser(testUserData, { uid: 'test-admin' });
    console.log('Created user:', newUser);
    
    console.log('2. Assigning projects...');
    await assignUserToProjects(newUser.id, testProjectIds);
    console.log('Projects assigned successfully');
    
    console.log('3. Verifying user profile...');
    const userProfile = await getUserById(newUser.id);
    console.log('User profile:', {
      id: userProfile.id,
      code: userProfile.code,
      email: userProfile.email,
      orgIds: userProfile.orgIds,
      projectIds: userProfile.projectIds,
      lastOrgId: userProfile.lastOrgId,
      policies: userProfile.policies
    });
    
    console.log('4. Checking projects_members records...');
    const projectsMembers = await checkProjectsMembers(newUser.id);
    console.log('Projects members records:', projectsMembers);
    
    console.log('5. Testing queries...');
    const testResults = await testProjectsMembersQuery(newUser.id, userProfile.orgIds[0]);
    console.log('Query test results:', testResults);
    
    console.log('=== TEST COMPLETED ===');
    
    return {
      user: userProfile,
      projectsMembers,
      queryResults: testResults
    };
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Simple keyword generator for users
// Example output: [code, tokens from name/email, role]
export function generateUserKeywords({ displayName = '', email = '', code = '', role = '' } = {}) {
  const result = new Set();
  const push = (v) => {
    const s = (v || '').toString().trim().toLowerCase();
    if (s && s.length >= 2) result.add(s);
  };

  // code (can be number-like or text)
  if ((code || '').toString().trim()) result.add(code.toString());

  // displayName tokens, split by non-alphanumeric (keep dot/space)
  (displayName || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .forEach(push);

  // email local-part tokens (before @)
  const local = (email || '').toLowerCase().split('@')[0] || '';
  local
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .forEach(push);

  // role
  push(role);

  return Array.from(result);
}

