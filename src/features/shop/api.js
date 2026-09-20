import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import {
  STARTER_SHOP_ITEMS,
  createShopItem,
  createUserInventoryItem,
} from '../../entities/shop/model.js';

/**
 * Realtime subscription to active shop catalog items
 * @param {(items: import('../../entities/shop/model.js').ShopItem[]) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @param {boolean} [includeInactive=false] - For admin management view
 * @returns {() => void} unsubscribe
 */
export function subscribeShopItems(onUpdate, onError, includeInactive = false) {
  const colRef = collection(db, COLLECTIONS.SHOP_ITEMS);

  return onSnapshot(
    colRef,
    (snap) => {
      let list = snap.docs.map((d) => ({ id: d.id, ...createShopItem(d.data()) }));
      if (list.length === 0) {
        // Fallback to starter catalog when DB is unpopulated
        list = [...STARTER_SHOP_ITEMS];
      }
      if (!includeInactive) {
        list = list.filter((i) => i.isActive !== false);
      }
      // Sort by price ascending, then rarity
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
      onUpdate(list);
    },
    (err) => {
      // Resilient fallback to static starter items
      onUpdate(STARTER_SHOP_ITEMS.filter((i) => includeInactive || i.isActive !== false));
      if (onError) onError(err);
    }
  );
}

/**
 * Realtime subscription to user's purchased inventory items
 * @param {string} userId
 * @param {(inventory: import('../../entities/shop/model.js').UserInventoryItem[]) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeUserInventory(userId, onUpdate, onError) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.USER_INVENTORY),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...createUserInventoryItem(d.data()) }));
      onUpdate(list);
    },
    (err) => {
      onUpdate([]);
      if (onError) onError(err);
    }
  );
}

/**
 * Call Cloud Function to purchase an item with coins
 * @param {{ itemId: string }} params
 * @returns {Promise<{ success: boolean, newBalance: number, purchasedItem: any }>}
 */
export async function purchaseShopItemCall({ itemId }) {
  try {
    const fn = httpsCallable(functions, 'purchaseShopItem');
    const res = await fn({ itemId });
    return res.data;
  } catch (err) {
    console.error('purchaseShopItemCall failed:', err);
    throw new Error(err.message || 'Не удалось совершить покупку');
  }
}

/**
 * Call Cloud Function to equip or unequip an item of a given category
 * @param {{ itemId: string|null, category: string, unequip?: boolean }} params
 * @returns {Promise<{ success: boolean, equippedItemId: string|null }>}
 */
export async function equipShopItemCall({ itemId, category, unequip = false }) {
  try {
    const fn = httpsCallable(functions, 'equipShopItem');
    const res = await fn({ itemId, category, unequip });
    return res.data;
  } catch (err) {
    console.error('equipShopItemCall failed:', err);
    throw new Error(err.message || 'Не удалось изменить экипировку');
  }
}

/**
 * Save or update a shop item (Admin / Coordinator)
 * @param {import('../../entities/shop/model.js').ShopItem} item
 */
export async function saveShopItem(item) {
  const docRef = doc(db, COLLECTIONS.SHOP_ITEMS, item.id);
  await setDoc(docRef, item, { merge: true });
}

/**
 * Toggle active status of a shop item
 * @param {string} itemId
 * @param {boolean} isActive
 */
export async function toggleShopItemActive(itemId, isActive) {
  const docRef = doc(db, COLLECTIONS.SHOP_ITEMS, itemId);
  await updateDoc(docRef, { isActive });
}

/**
 * Seed starter shop items into live Firestore database if empty
 */
export async function seedStarterShopItemsIfEmpty() {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.SHOP_ITEMS));
    if (snap.empty) {
      const batch = writeBatch(db);
      STARTER_SHOP_ITEMS.forEach((item) => {
        const docRef = doc(db, COLLECTIONS.SHOP_ITEMS, item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
      console.log('Successfully seeded 16 starter shop items to Firestore');
    }
  } catch (err) {
    console.warn('seedStarterShopItemsIfEmpty note:', err.message);
  }
}
