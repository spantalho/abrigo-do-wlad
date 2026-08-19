import { initializeApp, getApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getEnvValue, type CloudflareEnv } from "./env";

export function getDb(env?: CloudflareEnv) {
  const serviceAccount = {
    projectId: getEnvValue(env, "FIREBASE_PROJECT_ID"),
    clientEmail: getEnvValue(env, "FIREBASE_CLIENT_EMAIL"),
    privateKey: getEnvValue(env, "FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n"),
  };

  const app = !getApps().length
    ? initializeApp(
        serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey
          ? { credential: cert(serviceAccount) }
          : undefined,
      )
    : getApp();

  return getFirestore(app);
}
