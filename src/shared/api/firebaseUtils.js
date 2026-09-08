import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';

export const COLLECTIONS = {
  USERS: 'users',
  STUDENTS: 'students',
  ACTIVITIES: 'activities',
  ACTIVITY_GROUPS: 'activity_groups',
  ENROLLMENTS: 'enrollments',
  WAITLIST: 'waitlist',
  ATTENDANCE: 'attendance',
  PAYMENTS: 'payments',
  PARENT_INVITES: 'parent_invites',
  ACHIEVEMENTS: 'achievements',
  NOTIFICATIONS: 'notifications',
};

/**
 * Generic helper to fetch a single document by ID
 * @param {string} collectionName
 * @param {string} id
 * @returns {Promise<any|null>}
 */
export async function getDocument(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Generic helper to fetch all documents or run query in collection
 * @param {string} collectionName
 * @param {any[]} queryConstraints
 * @returns {Promise<any[]>}
 */
export async function getDocuments(collectionName, ...queryConstraints) {
  const colRef = collection(db, collectionName);
  const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

/**
 * Generic helper to set/create a document
 * @param {string} collectionName
 * @param {string} id
 * @param {any} data
 */
export async function setDocument(collectionName, id, data) {
  const docRef = doc(db, collectionName, id);
  return setDoc(docRef, data, { merge: true });
}

/**
 * Generic helper to update a document
 * @param {string} collectionName
 * @param {string} id
 * @param {any} data
 */
export async function updateDocument(collectionName, id, data) {
  const docRef = doc(db, collectionName, id);
  return updateDoc(docRef, data);
}

/**
 * Generic helper to delete a document
 * @param {string} collectionName
 * @param {string} id
 */
export async function deleteDocument(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  return deleteDoc(docRef);
}
