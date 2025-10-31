import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTION = 'settings';

// Read a settings document by key (e.g., 'webGeneral' or project scoped key like `project_<projectId>`)
export async function getSettingsByKey(key) {
  const ref = doc(db, COLLECTION, key);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Save/merge a settings document by key
export async function saveSettingsByKey(key, data) {
  const ref = doc(db, COLLECTION, key);
  await setDoc(ref, data, { merge: true });
  return true;
}
