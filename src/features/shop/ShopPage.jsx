import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Coins,
  Sparkles,
  ShoppingBag,
  Check,
  ShieldAlert,
  User,
  ExternalLink,
  Loader2,
  Crown,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { PageHeader, Button, Card, Badge, Modal } from '../../shared/ui/index.js';
import {
  SHOP_CATEGORIES,
  SHOP_CATEGORY_LABELS,
  RARITY_CONFIG,
  STARTER_SHOP_ITEMS,
} from '../../entities/shop/model.js';
import {
  subscribeShopItems,
  subscribeUserInventory,
  purchaseShopItemCall,
  equipShopItemCall,
} from './api.js';
import { subscribeUserBalance } from '../gamification/api.js';
import { CosmeticItemPreview, StudentTitleBadge } from './ShopCosmetics.jsx';
import './shopStyles.css';

export function ShopPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState(SHOP_CATEGORIES.AVATAR_FRAME);
  const [items, setItems] = useState(STARTER_SHOP_ITEMS);
  const [inventory, setInventory] = useState([]);
  const [balance, setBalance] = useState({ coins: 0, xpPoints: 0 });
  const [loadingItems, setLoadingItems] = useState(true);
  const [purchasingItem, setPurchasingItem] = useState(null);
  const [confirmModalItem, setConfirmModalItem] = useState(null);
  const [equippingItemId, setEquippingItemId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Subscribe to shop catalog, user inventory and balance
  useEffect(() => {
    setLoadingItems(true);
    const unsubItems = subscribeShopItems(
      (catalog) => {
        setItems(catalog || STARTER_SHOP_ITEMS);
        setLoadingItems(false);
      },
      () => setLoadingItems(false)
    );

    let unsubInventory = () => {};
    let unsubBalance = () => {};

    if (user?.id) {
      unsubInventory = subscribeUserInventory(user.id, (inv) => {
        setInventory(inv || []);
      });
      unsubBalance = subscribeUserBalance(user.id, (bal) => {
        setBalance(bal || { coins: 0, xpPoints: 0 });
      });
    }

    return () => {
      unsubItems();
      unsubInventory();
      unsubBalance();
    };
  }, [user?.id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const currentCoins = balance?.coins || 0;

  // Map inventory for fast lookup
  const ownedItemIds = new Set(inventory.map((inv) => inv.itemId));
  const equippedItemMap = {};
  inventory.forEach((inv) => {
    if (inv.isEquipped) {
      equippedItemMap[inv.itemCategory] = inv.itemId;
    }
  });

  // Filter items by category
  const filteredItems = items.filter((item) => item.category === activeCategory);

  const handlePurchase = async () => {
    if (!confirmModalItem) return;
    try {
      setPurchasingItem(confirmModalItem.id);
      setErrorMessage(null);
      await purchaseShopItemCall({ itemId: confirmModalItem.id });
      showToast(`Предмет «${confirmModalItem.name}» успешно куплен и добавлен в ваш инвентарь!`);
      setConfirmModalItem(null);
    } catch (err) {
      setErrorMessage(err.message || 'Ошибка покупки');
    } finally {
      setPurchasingItem(null);
    }
  };

  const handleToggleEquip = async (item, isCurrentlyEquipped) => {
    try {
      setEquippingItemId(item.id);
      setErrorMessage(null);
      await equipShopItemCall({
        itemId: item.id,
        category: item.category,
        unequip: isCurrentlyEquipped,
      });
      showToast(
        isCurrentlyEquipped
          ? `Предмет «${item.name}» снят`
          : `Предмет «${item.name}» успешно экипирован в профиле!`
      );
    } catch (err) {
      setErrorMessage(err.message || 'Ошибка изменения экипировки');
    } finally {
      setEquippingItemId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <PageHeader
        title="Магазин кастомизации ExtraHub"
        subtitle="Тратьте заработанные Extra-монеты на визуальное оформление своего профиля, рамки аватара и почётные титулы"
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          style={{
            marginBottom: '20px',
            padding: '12px 18px',
            backgroundColor: 'var(--success-light, #ecfdf5)',
            color: 'var(--success, #10b981)',
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--success, #10b981)',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            marginBottom: '20px',
            padding: '12px 18px',
            backgroundColor: 'var(--danger-light, #fef2f2)',
            color: 'var(--danger, #ef4444)',
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--danger, #ef4444)',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Banner Card: Coins Balance & Navigation to Profile */}
      <Card
        style={{
          borderRadius: 'var(--radius-lg, 16px)',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, var(--bg-surface, #ffffff) 0%, var(--bg-subtle, #f8fafc) 100%)',
          border: '1px solid var(--border-color, #e2e8f0)',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          {/* Left: Coin Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)',
                boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#78350f',
              }}
            >
              <Coins size={28} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', fontWeight: 500 }}>
                Ваш текущий баланс монет
              </div>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0f172a)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{currentCoins.toLocaleString('ru-RU')}</span>
                <span style={{ fontSize: '16px', color: '#d97706' }}>🪙 Extra-монет</span>
              </div>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NavLink to="/student/profile" style={{ textDecoration: 'none' }}>
              <Button variant="outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} />
                <span>Мой профиль и витрина</span>
                <ArrowRight size={14} />
              </Button>
            </NavLink>
          </div>
        </div>
      </Card>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {[
          { id: SHOP_CATEGORIES.AVATAR_FRAME, label: 'Рамки аватара', icon: Sparkles, count: items.filter((i) => i.category === SHOP_CATEGORIES.AVATAR_FRAME).length },
          { id: SHOP_CATEGORIES.PROFILE_BANNER, label: 'Фоны профиля', icon: Layers, count: items.filter((i) => i.category === SHOP_CATEGORIES.PROFILE_BANNER).length },
          { id: SHOP_CATEGORIES.TITLE, label: 'Титулы', icon: Crown, count: items.filter((i) => i.category === SHOP_CATEGORIES.TITLE).length },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--primary, #4f46e5)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: isActive ? 'var(--primary, #4f46e5)' : 'var(--text-secondary, #64748b)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: isActive ? 'var(--primary-light, #e0e7ff)' : 'var(--bg-subtle, #f1f5f9)',
                  color: isActive ? 'var(--primary, #4f46e5)' : 'var(--text-secondary, #64748b)',
                  fontWeight: 600,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Catalog Grid */}
      {loadingItems ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Загрузка товаров магазина...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <ShoppingBag size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            В этой категории пока нет товаров
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Скоро здесь появятся новые эксклюзивные предметы!
          </p>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: '20px',
          }}
        >
          {filteredItems.map((item) => {
            const isOwned = ownedItemIds.has(item.id);
            const isEquipped = equippedItemMap[item.category] === item.id;
            const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
            const canAfford = currentCoins >= item.price;
            const isProcessingThis = purchasingItem === item.id || equippingItemId === item.id;

            return (
              <div
                key={item.id}
                className="shop-item-card"
                style={{
                  borderColor: isEquipped ? 'var(--primary, #4f46e5)' : rarity.borderColor,
                  boxShadow: isEquipped ? '0 0 0 2px var(--primary-light, #c7d2fe)' : undefined,
                }}
              >
                {/* Header tag: Rarity badge & Equipped pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      color: rarity.color,
                      backgroundColor: rarity.bgBadge,
                      border: `1px solid ${rarity.borderColor}`,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {rarity.label}
                  </span>

                  {isEquipped && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        color: '#ffffff',
                        backgroundColor: 'var(--primary, #4f46e5)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                      <span>Экипировано</span>
                    </span>
                  )}
                </div>

                {/* Live CSS miniature preview */}
                <CosmeticItemPreview item={item} />

                {/* Item Details */}
                <div style={{ flex: 1, marginBottom: '16px' }}>
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      margin: '0 0 6px 0',
                      color: 'var(--text-primary, #0f172a)',
                    }}
                  >
                    {item.name}
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary, #64748b)',
                      lineHeight: 1.45,
                      margin: 0,
                    }}
                  >
                    {item.description || 'Эксклюзивный косметический предмет для учеников школы.'}
                  </p>
                </div>

                {/* Footer: Price and Action Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color, #f1f5f9)',
                    paddingTop: '14px',
                    gap: '12px',
                  }}
                >
                  {/* Price */}
                  <div>
                    {!isOwned ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color: canAfford ? 'var(--text-primary, #0f172a)' : 'var(--danger, #ef4444)',
                          }}
                        >
                          {item.price.toLocaleString('ru-RU')}
                        </span>
                        <span style={{ fontSize: '13px', color: '#d97706', fontWeight: 600 }}>🪙</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--success, #10b981)', fontWeight: 600 }}>
                        ✓ Куплено
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    {isOwned ? (
                      <Button
                        size="sm"
                        variant={isEquipped ? 'outline' : 'primary'}
                        onClick={() => handleToggleEquip(item, isEquipped)}
                        disabled={isProcessingThis}
                        style={{ minWidth: '110px' }}
                      >
                        {isProcessingThis ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isEquipped ? (
                          'Снять'
                        ) : (
                          'Экипировать'
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={canAfford ? 'primary' : 'outline'}
                        onClick={() => setConfirmModalItem(item)}
                        disabled={!canAfford || isProcessingThis}
                        style={{ minWidth: '110px' }}
                      >
                        {isProcessingThis ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : canAfford ? (
                          'Купить'
                        ) : (
                          'Мало монет'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {confirmModalItem && (
        <Modal
          isOpen={Boolean(confirmModalItem)}
          onClose={() => setConfirmModalItem(null)}
          title="Подтверждение покупки"
        >
          <div style={{ padding: '8px 0', textAlign: 'center' }}>
            <CosmeticItemPreview item={confirmModalItem} />

            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '12px 0 6px 0',
              }}
            >
              {confirmModalItem.name}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
              {confirmModalItem.description}
            </p>

            {/* Price Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                borderRadius: 'var(--radius-md, 12px)',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Стоимость предмета:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {confirmModalItem.price} 🪙
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ваш текущий баланс:</span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>
                  {currentCoins} 🪙
                </span>
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--border-color, #e2e8f0)',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                <span>Остаток после покупки:</span>
                <span style={{ color: currentCoins >= confirmModalItem.price ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)' }}>
                  {(currentCoins - confirmModalItem.price).toLocaleString('ru-RU')} 🪙
                </span>
              </div>
            </div>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={() => setConfirmModalItem(null)}
                disabled={Boolean(purchasingItem)}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={handlePurchase}
                disabled={Boolean(purchasingItem)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {purchasingItem ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Обработка...</span>
                  </>
                ) : (
                  <>
                    <Coins size={16} />
                    <span>Купить за {confirmModalItem.price} монет</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
