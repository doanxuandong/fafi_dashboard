import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyABd9VgP62u-gGzm84eb2blkmCRmtRLGds",
  authDomain: "fafi-hvb.firebaseapp.com",
  projectId: "fafi-hvb",
  storageBucket: "fafi-hvb.firebasestorage.app",
  messagingSenderId: "994213323167",
  appId: "1:994213323167:web:6dc221c56606399fb95daa"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
