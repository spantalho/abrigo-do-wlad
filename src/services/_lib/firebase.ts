import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

function getFirebaseEnv(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  // Defensive normalization for values copied with quotes/spaces.
  return value.trim().replace(/^['"]|['"]$/g, "");
}

const firebaseConfig = {
  apiKey: getFirebaseEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: getFirebaseEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: getFirebaseEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: getFirebaseEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: getFirebaseEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: getFirebaseEnv(import.meta.env.VITE_FIREBASE_APP_ID)
};

const missingFirebaseVars = [
  ["VITE_FIREBASE_API_KEY", firebaseConfig.apiKey],
  ["VITE_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
  ["VITE_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
  ["VITE_FIREBASE_APP_ID", firebaseConfig.appId],
].filter(([, value]) => !value);

if (missingFirebaseVars.length > 0) {
  const missingKeys = missingFirebaseVars.map(([key]) => key).join(", ");
  throw new Error(`Firebase config incompleta. Defina: ${missingKeys}`);
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
