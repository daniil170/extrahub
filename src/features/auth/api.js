import { auth, functions } from '../../app/config/firebase.js';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { getDocument, setDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { createUser } from '../../entities/user/model.js';

/**
 * Sign in user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('../../entities/user/model.js').User>}
 */
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userProfile = await getDocument(COLLECTIONS.USERS, credential.user.uid);
  return userProfile || createUser({ id: credential.user.uid, email: credential.user.email || '' });
}

/**
 * Register user with email and password
 * @param {string} email
 * @param {string} password
 * @param {Partial<import('../../entities/user/model.js').User>} profileData
 */
export async function registerWithEmail(email, password, profileData) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = createUser({
    id: credential.user.uid,
    email,
    ...profileData,
  });
  await setDocument(COLLECTIONS.USERS, user.id, user);
  return user;
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  return signOut(auth);
}

/**
 * Call switchDemoRole Cloud Function and sign in with the resulting custom token
 * @param {'student' | 'parent' | 'teacher' | 'coordinator' | 'technician' | 'admin' | 'master'} targetRole
 */
export async function switchDemoRoleAndSignIn(targetRole) {
  const switchFn = httpsCallable(functions, 'switchDemoRole');
  const result = await switchFn({ targetRole });
  const { customToken } = result.data;
  const userCredential = await signInWithCustomToken(auth, customToken);
  return userCredential.user;
}

