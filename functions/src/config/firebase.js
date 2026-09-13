import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const isTesting = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

export const app = getApps().length === 0
  ? (isTesting
      ? initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'extrahub-test-project' })
      : initializeApp())
  : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
