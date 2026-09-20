import { useState, useEffect } from 'react';
import {
  Plus,
  ShoppingBag,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Database,
  Check,
  AlertTriangle,
  Loader2,
  Edit2,
  Layers,
  Crown,
} from 'lucide-react';
import { Button, Card, Modal, Badge } from '../../shared/ui/index.js';
import {
  SHOP_CATEGORIES,
  SHOP_CATEGORY_LABELS,
  ITEM_RARITIES,
  RARITY_CONFIG,
  CSS_EFFECT_PRESETS,
  STARTER_SHOP_ITEMS,
  createShopItem,
} from '../../entities/shop/model.js';
import {
  subscribeShopItems,
  saveShopItem,
  toggleShopItemActive,
  seedStarterShopItemsIfEmpty,
} from './api.js';
import { CosmeticItemPreview } from './ShopCosmetics.jsx';

export function ShopAdminManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(SHOP_CATEGORIES.AVATAR_FRAME);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: SHOP_CATEGORIES.AVATAR_FRAME,
    price: 300,
    rarity: ITEM_RARITIES.RARE,
    cssEffectId: 'frame-neon-cyan',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeShopItems(
      (list) => {
        setItems(list || STARTER_SHOP_ITEMS);
        setLoading(false);
      },
      () => setLoading(false),
      true // include inactive
    );
    return () => unsub();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    const defaultPreset = CSS_EFFECT_PRESETS[SHOP_CATEGORIES.AVATAR_FRAME][0]?.id || 'frame-academic-ribbon';
    setFormData({
      id: `item-${Date.now()}`,
      name: '',
      category: SHOP_CATEGORIES.AVATAR_FRAME,
      price: 250,
      rarity: ITEM_RARITIES.COMMON,
      cssEffectId: defaultPreset,
      description: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      rarity: item.rarity,
      cssEffectId: item.cssEffectId,
      description: item.description || '',
      isActive: item.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleCategoryChange = (newCategory) => {
    const defaultPreset = CSS_EFFECT_PRESETS[newCategory]?.[0]?.id || '';
    setFormData((prev) => ({
      ...prev,
      category: newCategory,
      cssEffectId: defaultPreset,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      const itemToSave = createShopItem({
        id: formData.id || `item-${Date.now()}`,
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price) || 100,
        rarity: formData.rarity,
        cssEffectId: formData.cssEffectId,
        description: formData.description.trim(),
        isActive: formData.isActive,
      });

      await saveShopItem(itemToSave);
      showToast(`Товар «${itemToSave.name}» успешно сохранён!`);
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Ошибка сохранения товара');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const nextStatus = !item.isActive;
      await toggleShopItemActive(item.id, nextStatus);
      showToast(`Товар «${item.name}» ${nextStatus ? 'активирован' : 'снят с продажи'}`);
    } catch (err) {
      showToast(err.message || 'Ошибка обновления статуса');
    }
  };

  const handleSeedStarterItems = async () => {
    try {
      setSeeding(true);
      await seedStarterShopItemsIfEmpty();
      showToast('16 стартовых товаров успешно синхронизированы с базой данных!');
    } catch (err) {
      showToast(err.message || 'Ошибка инициализации товаров');
    } finally {
      setSeeding(false);
    }
  };

  const availablePresets = CSS_EFFECT_PRESETS[formData.category] || [];

  return (
    <Card style={{ borderRadius: 'var(--radius-lg, 16px)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag size={22} color="var(--primary, #4f46e5)" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Управление товарами магазина кастомизации
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Добавляйте новые рамки, фоны и титулы, регулируйте цены и визуальные пресеты
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSeedStarterItems}
            disabled={seeding}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {seeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            <span>Синхронизировать стартовые товары</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleOpenAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>Добавить товар</span>
          </Button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          style={{
            marginBottom: '16px',
            padding: '10px 16px',
            backgroundColor: 'var(--success-light, #ecfdf5)',
            color: 'var(--success, #10b981)',
            borderRadius: 'var(--radius-sm, 8px)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Items Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p>Загрузка товаров...</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13.5px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Превью</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Название</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Категория</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Редкость</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Цена (монеты)</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Статус</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
                const isActive = item.isActive !== false;

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      opacity: isActive ? 1 : 0.6,
                    }}
                  >
                    <td style={{ padding: '10px 12px', width: '70px' }}>
                      <div style={{ width: '48px', height: '48px' }}>
                        <CosmeticItemPreview item={item} />
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div>{item.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                        {item.id}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {SHOP_CATEGORY_LABELS[item.category] || item.category}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          color: rarity.color,
                          backgroundColor: rarity.bgBadge,
                          border: `1px solid ${rarity.borderColor}`,
                        }}
                      >
                        {rarity.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.price} 🪙
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: isActive ? 'var(--success, #10b981)' : 'var(--text-secondary)',
                        }}
                      >
                        {isActive ? 'В продаже' : 'Снят с продажи'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(item)}
                          title={isActive ? 'Снять с продажи' : 'Вернуть в продажу'}
                        >
                          {isActive ? 'Деактивировать' : 'Активировать'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? 'Редактировать товар' : 'Добавить новый товар'}
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Live Preview Header */}
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <CosmeticItemPreview item={formData} />
            </div>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Название товара *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Неоновый кристалл"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Категория
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value={SHOP_CATEGORIES.AVATAR_FRAME}>Рамка аватара</option>
                  <option value={SHOP_CATEGORIES.PROFILE_BANNER}>Фон профиля</option>
                  <option value={SHOP_CATEGORIES.TITLE}>Титул</option>
                </select>
              </div>

              {/* Rarity */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Редкость
                </label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value={ITEM_RARITIES.COMMON}>Обычный (Common)</option>
                  <option value={ITEM_RARITIES.RARE}>Редкий (Rare)</option>
                  <option value={ITEM_RARITIES.EPIC}>Эпический (Epic)</option>
                  <option value={ITEM_RARITIES.LEGENDARY}>Легендарный (Legendary)</option>
                </select>
              </div>
            </div>

            {/* Price & Safe Visual Preset */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Цена (в Extra-монетах 🪙)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Безопасный визуальный CSS-пресет
                </label>
                <select
                  value={formData.cssEffectId}
                  onChange={(e) => setFormData({ ...formData, cssEffectId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  {availablePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Описание
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание эффекта для учеников..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить товар'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}
