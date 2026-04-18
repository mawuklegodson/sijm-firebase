
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase configuration - prioritized for Vercel/Production
// We use import.meta.env for Vercel and a fallback for the sandbox environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (window as any).FIREBASE_CONFIG?.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (window as any).FIREBASE_CONFIG?.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (window as any).FIREBASE_CONFIG?.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (window as any).FIREBASE_CONFIG?.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (window as any).FIREBASE_CONFIG?.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (window as any).FIREBASE_CONFIG?.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (window as any).FIREBASE_CONFIG?.firestoreDatabaseId || '(default)'
};

// If we are in the sandbox, we might have a local config file
// This is a helper to load it if it exists without breaking the production build
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
  try {
    // This is only for the sandbox environment
    const localConfig = await import('../firebase-applet-config.json').then(m => m.default);
    if (localConfig && localConfig.apiKey) {
      Object.assign(firebaseConfig, localConfig);
      console.log("SIJM CMS: Local config loaded successfully.");
    }
  } catch (e) {
    // No local config found
  }
}

// Check if we are in mock mode (no API key provided)
export const isMockMode = !firebaseConfig.apiKey || 
                          firebaseConfig.apiKey === 'undefined' || 
                          firebaseConfig.apiKey.includes('placeholder');

if (isMockMode) {
  console.warn("SIJM CMS: Running in MOCK MODE (Demo Data). Check Firebase Env Vars.");
} else {
  console.log(`SIJM CMS: Firebase Production Database Detected (${firebaseConfig.firestoreDatabaseId}). Connecting...`);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Disable persistence for offline support - Temporarily disabled to fix "Unexpected state" assertion errors
/*
if (!isMockMode && typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}
*/

export { firebaseConfig };
export default app;
