import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to equip or unequip a cosmetic item
 * Ensures only one item per category can be equipped simultaneously
 */
export const equipShopItem = onCall(async (request) => {
  try {
    const { itemId, category, unequip = false } = request.data || {};

    if (!category || typeof category !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр category обязателен');
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    const userId = request.auth.uid;

    if (!unequip && (!itemId || typeof itemId !== 'string')) {
      throw new HttpsError('invalid-argument', 'Для экипировки требуется указать itemId');
    }

    const inventoryQuerySnap = await db
      .collection('userInventory')
      .where('userId', '==', userId)
      .where('itemCategory', '==', category)
      .get();

    const batch = db.batch();

    // 1. Unequip all currently equipped items in this category
    inventoryQuerySnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.isEquipped) {
        batch.update(docSnap.ref, { isEquipped: false });
      }
    });

    // 2. If equipping an item, verify ownership and equip
    if (!unequip && itemId) {
      const targetDocId = `${userId}_${itemId}`;
      const targetDocRef = db.collection('userInventory').doc(targetDocId);
      const targetDoc = await targetDocRef.get();

      if (!targetDoc.exists) {
        throw new HttpsError('not-found', 'Этот предмет отсутствует в вашем инвентаре');
      }

      batch.update(targetDocRef, { isEquipped: true });
    }

    await batch.commit();

    await logAuditEvent({
      userId,
      action: unequip ? 'shop_item_unequipped' : 'shop_item_equipped',
      resourceId: itemId || category,
      details: {
        category,
        itemId: unequip ? null : itemId,
      },
    });

    return {
      success: true,
      category,
      equippedItemId: unequip ? null : itemId,
    };
  } catch (err) {
    if (err instanceof HttpsError) {
      throw err;
    }
    await logFunctionError('equipShopItem', err, {
      userId: request.auth?.uid,
      data: request.data,
    });
    throw new HttpsError('internal', err.message || 'Ошибка смены экипировки');
  }
});
