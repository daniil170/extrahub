import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const isTesting = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  (isTesting ? 'extrahub-test-project' : 'extrahub-c95af');

export const app = getApps().length === 0
  ? initializeApp({ projectId })
  : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
