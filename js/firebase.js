import { FIREBASE_CONFIG, FIREBASE_ENABLED } from './config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

let appPromise = null;

/** Shared Firebase app (one initializeApp for Auth + RTDB). */
export async function getFirebaseApp() {
  if (!FIREBASE_ENABLED) return null;
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp } = await import(`${SDK}/firebase-app.js`);
      return initializeApp(FIREBASE_CONFIG);
    })();
  }
  return appPromise;
}

export async function getFirebaseAuth() {
  const app = await getFirebaseApp();
  if (!app) return null;
  const { getAuth } = await import(`${SDK}/firebase-auth.js`);
  return getAuth(app);
}

export async function getFirebaseDatabase() {
  const app = await getFirebaseApp();
  if (!app) return null;
  const { getDatabase } = await import(`${SDK}/firebase-database.js`);
  return getDatabase(app);
}
