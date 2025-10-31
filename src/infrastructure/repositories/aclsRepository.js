import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'acls';

export async function listAcls({ orgId, projectId, role, resource } = {}) {
  const colRef = collection(db, COLLECTION);
  const constraints = [];
  if (orgId) constraints.push(where('orgId', '==', orgId));
  if (projectId) constraints.push(where('projectId', '==', projectId));
  if (role) constraints.push(where('role', '==', role));
  if (resource) constraints.push(where('resource', '==', resource));

  const q = constraints.length ? query(colRef, ...constraints) : colRef;

  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  return items;
}

export async function createAclRule(data, user) {
  const docRef = doc(collection(db, COLLECTION));
  const id = docRef.id;
  
  const payload = {
    id,
    orgId: data.orgId,
    projectId: data.projectId || null,
    role: data.role,
    resource: data.resource,
    permissionActions: data.permissionActions || [],
    owner: data.owner || user?.uid || 'system',
  };
  
  await setDoc(docRef, payload);
  return { id, ...payload };
}

export async function updateAclRule(id, data, user) {
  const ref = doc(db, COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}

export async function deleteAclRule(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

