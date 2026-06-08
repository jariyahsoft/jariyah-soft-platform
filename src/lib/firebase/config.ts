import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { 
  initializeFirestore, 
  connectFirestoreEmulator, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent cache (browser only)
const db = initializeFirestore(app, {
  localCache: typeof window !== 'undefined'
    ? persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      })
    : undefined,
});

const auth = getAuth(app);
const storage = getStorage(app);

// Connect to emulators in development mode.
// The module-level flag prevents double-connections during HMR / SSR.
let emulatorsConnected = false;

if (process.env.NODE_ENV === 'development' && !emulatorsConnected) {
  emulatorsConnected = true;
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8088);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export { app, auth, db, storage };
