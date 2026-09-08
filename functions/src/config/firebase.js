import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'extrahub-dev';

export const app = getApps().length === 0 ? initializeApp({ projectId }) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
