import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { getOrCreateUserBalance } from '../shared/gamification.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to purchase a cosmetic item from the shop with coins
 */
export const purchaseShopItem = onCall(async (request) => {
  try {
    const { itemId } = request.data || {};

    if (!itemId || typeof itemId !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр itemId обязателен');
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    const userId = request.auth.uid;
    const now = new Date();
    const nowStr = now.toISOString();

    const result = await db.runTransaction(async (transaction) => {
      // 1. Fetch shop item
      const itemRef = db.collection('shopItems').doc(itemId);
      const itemDoc = await transaction.get(itemRef);

      let itemData = null;
      if (itemDoc.exists) {
        itemData = itemDoc.data();
      } else {
        // Starter items static fallback if not yet seeded
        const { STARTER_SHOP_ITEMS } = await import('../../src/entities/shop/model.js').catch(() => ({ STARTER_SHOP_ITEMS: [] }));
        const fallback = STARTER_SHOP_ITEMS?.find((i) => i.id === itemId);
        if (fallback) {
          itemData = fallback;
        } else {
          throw new HttpsError('not-found', `Товар ${itemId} не найден в каталоге`);
        }
      }

      if (itemData.isActive === false) {
        throw new HttpsError('failed-precondition', 'Этот товар временно снят с продажи');
      }

      const itemPrice = Number(itemData.price) || 0;
      const itemCategory = itemData.category || 'avatar_frame';
      const itemName = itemData.name || 'Предмет магазина';

      // 2. Check if user already owns this item
      const inventoryDocId = `${userId}_${itemId}`;
      const inventoryRef = db.collection('userInventory').doc(inventoryDocId);
      const inventoryDoc = await transaction.get(inventoryRef);

      if (inventoryDoc.exists) {
        throw new HttpsError('already-exists', 'У вас уже есть этот предмет в инвентаре');
      }

      // 3. Check user coin balance
      const { balanceRef, data: balance } = await getOrCreateUserBalance(transaction, userId);
      const currentCoins = balance.coins || 0;

      if (currentCoins < itemPrice) {
        throw new HttpsError(
          'failed-precondition',
          `Недостаточно монет. Стоимость: ${itemPrice} 🪙, у вас на балансе: ${currentCoins} 🪙`
        );
      }

      // 4. Deduct coins and update balance
      const newCoins = currentCoins - itemPrice;
      balance.coins = newCoins;
      balance.updatedAt = nowStr;
      transaction.set(balanceRef, balance, { merge: true });

      // 5. Create user inventory item
      const newInventoryItem = {
        id: inventoryDocId,
        userId,
        itemId,
        itemCategory,
        isEquipped: false,
        purchasedAt: nowStr,
      };
      transaction.set(inventoryRef, newInventoryItem);

      // 6. Record points ledger entry
      const ledgerDocId = `ledger_${userId}_shop_purchase_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const ledgerRef = db.collection('pointsLedger').doc(ledgerDocId);
      transaction.set(ledgerRef, {
        id: ledgerDocId,
        userId,
        amount: -itemPrice,
        currencyType: 'coin',
        source: 'shop_purchase',
        sourceRefId: itemId,
        reason: `Покупка в магазине: ${itemName}`,
        createdBy: userId,
        createdAt: nowStr,
        metadata: {
          itemId,
          itemName,
          category: itemCategory,
          price: itemPrice,
        },
      });

      return {
        success: true,
        newBalance: newCoins,
        purchasedItem: {
          id: itemId,
          name: itemName,
          category: itemCategory,
          price: itemPrice,
        },
      };
    });

    await logAuditEvent({
      userId,
      action: 'shop_item_purchased',
      resourceId: itemId,
      details: {
        itemId,
        newBalance: result.newBalance,
      },
    });

    return result;
  } catch (err) {
    if (err instanceof HttpsError) {
      throw err;
    }
    await logFunctionError('purchaseShopItem', err, {
      userId: request.auth?.uid,
      data: request.data,
    });
    throw new HttpsError('internal', err.message || 'Ошибка обработки покупки');
  }
});
