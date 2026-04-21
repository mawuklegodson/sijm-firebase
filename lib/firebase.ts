import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// ─── Firebase Configuration ───────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || (window as any).FIREBASE_CONFIG?.apiKey,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || (window as any).FIREBASE_CONFIG?.authDomain,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || (window as any).FIREBASE_CONFIG?.projectId,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || (window as any).FIREBASE_CONFIG?.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (window as any).FIREBASE_CONFIG?.messagingSenderId,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || (window as any).FIREBASE_CONFIG?.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    (window as any).FIREBASE_CONFIG?.firestoreDatabaseId ||
    '(default)',
};

// ─── Sandbox / local config loader (NO top-level await) ──────────────────────
// Top-level await was removed because Vercel/Rollup cannot bundle it in ESM
// modules used by Vite. We load the local JSON config non-blocking instead.
let localConfigLoaded = false;
function maybeLoadLocalConfig(): Promise<void> {
  if (localConfigLoaded || firebaseConfig.apiKey) return Promise.resolve();
  localConfigLoaded = true;
  return import('../firebase-applet-config.json')
    .then((m) => {
      const localConfig = m.default as Record<string, string>;
      if (localConfig?.apiKey) {
        Object.assign(firebaseConfig, localConfig);
        console.log('SIJM CMS: Local sandbox config loaded.');
      }
    })
    .catch(() => { /* No local config in production — expected */ });
}
maybeLoadLocalConfig();

// ─── Mock-mode detection ──────────────────────────────────────────────────────
export const isMockMode =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey === 'undefined' ||
  firebaseConfig.apiKey.includes('placeholder') ||
  firebaseConfig.apiKey.includes('your_');

if (isMockMode) {
  console.warn('SIJM CMS: MOCK MODE — set VITE_FIREBASE_* env vars in Vercel.');
} else {
  console.log(`SIJM CMS: Firebase connected (db: ${firebaseConfig.firestoreDatabaseId}).`);
}

// ─── Firebase App ─────────────────────────────────────────────────────────────
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = getAuth(app);

// ─── Firestore with multi-tab offline persistence ─────────────────────────────
// Uses Firebase JS SDK v10+ API. enableIndexedDbPersistence() was removed in v10.
let db: ReturnType<typeof getFirestore>;
if (!isMockMode) {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    }, firebaseConfig.firestoreDatabaseId);
  } catch {
    // Already initialized (e.g. Vite HMR) — just get the existing instance
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
} else {
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export { db, firebaseConfig };
export default app;
