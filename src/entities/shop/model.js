/**
 * Shop & Profile Customization Data Models
 * (Firestore Collections: shopItems, userInventory)
 */

/**
 * @typedef {'avatar_frame' | 'profile_banner' | 'title'} ShopItemCategory
 */

/**
 * @typedef {'common' | 'rare' | 'epic' | 'legendary'} ItemRarity
 */

/**
 * @typedef {Object} ShopItem
 * @property {string} id - Unique identifier for the shop item (e.g. 'frame-neon-cyan')
 * @property {string} name - Display title
 * @property {ShopItemCategory} category - Type of cosmetic item
 * @property {number} price - Price in coins
 * @property {ItemRarity} rarity - Cosmetic rarity grade
 * @property {string} cssEffectId - CSS effect identifier / class name
 * @property {string} [description] - Flavour text / lore description
 * @property {boolean} isActive - Whether the item is available for purchase
 * @property {string} createdAt - ISO timestamp
 */

/**
 * @typedef {Object} UserInventoryItem
 * @property {string} id - Unique inventory doc ID (usually `${userId}_${itemId}`)
 * @property {string} userId - ID of the owning student
 * @property {string} itemId - Reference to the ShopItem id
 * @property {ShopItemCategory} itemCategory - Redundant category for efficient filtering
 * @property {boolean} isEquipped - Whether this cosmetic is currently active on student's profile
 * @property {string} purchasedAt - ISO timestamp of purchase
 */

export const SHOP_CATEGORIES = {
  AVATAR_FRAME: 'avatar_frame',
  PROFILE_BANNER: 'profile_banner',
  TITLE: 'title',
};

export const SHOP_CATEGORY_LABELS = {
  avatar_frame: 'Рамка аватара',
  profile_banner: 'Фон профиля',
  title: 'Титул',
};

export const ITEM_RARITIES = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

export const RARITY_CONFIG = {
  common: {
    label: 'Обычный',
    color: '#94a3b8',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    bgBadge: 'rgba(148, 163, 184, 0.12)',
  },
  rare: {
    label: 'Редкий',
    color: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    bgBadge: 'rgba(56, 189, 248, 0.12)',
  },
  epic: {
    label: 'Эпический',
    color: '#a855f7',
    borderColor: 'rgba(168, 85, 247, 0.5)',
    bgBadge: 'rgba(168, 85, 247, 0.15)',
  },
  legendary: {
    label: 'Легендарный',
    color: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.6)',
    bgBadge: 'rgba(245, 158, 11, 0.18)',
  },
};

/**
 * Safe predefined CSS effect styles for items
 */
export const CSS_EFFECT_PRESETS = {
  avatar_frame: [
    { id: 'frame-academic-ribbon', name: 'Академическая лента', rarity: 'common' },
    { id: 'frame-neon-cyan', name: 'Неоновый кибер-блеск', rarity: 'rare' },
    { id: 'frame-emerald-scholar', name: 'Изумрудный кристалл', rarity: 'rare' },
    { id: 'frame-cosmic-purple', name: 'Космическая туманность', rarity: 'epic' },
    { id: 'frame-gold-championship', name: 'Золотой триумф', rarity: 'legendary' },
    { id: 'frame-cyber-glitch', name: 'Кибер-аномалия', rarity: 'legendary' },
  ],
  profile_banner: [
    { id: 'banner-minimalist-slate', name: 'Минимализм Slate', rarity: 'common' },
    { id: 'banner-science-blueprint', name: 'Чертёж Архимеда', rarity: 'rare' },
    { id: 'banner-cyberpunk-neon', name: 'Ночной Неополис', rarity: 'epic' },
    { id: 'banner-olympiad-gold', name: 'Золото Pifagor', rarity: 'epic' },
    { id: 'banner-cosmic-nebula', name: 'Звёздная Одиссея', rarity: 'legendary' },
  ],
  title: [
    { id: 'title-novice-explorer', name: 'Искатель знаний', rarity: 'common' },
    { id: 'title-problem-solver', name: 'Мастер решений', rarity: 'rare' },
    { id: 'title-streak-champion', name: 'Пламенный спринтер', rarity: 'rare' },
    { id: 'title-math-wizard', name: 'Архитектор алгоритмов', rarity: 'epic' },
    { id: 'title-legend-pifagor', name: 'Легенда Pifagor', rarity: 'legendary' },
  ],
};

/**
 * Initial Starter Catalog of 16 Curated Shop Items
 * @type {ShopItem[]}
 */
export const STARTER_SHOP_ITEMS = [
  // --- Avatar Frames (6 items) ---
  {
    id: 'frame-academic-ribbon',
    name: 'Академическая лента',
    category: 'avatar_frame',
    price: 150,
    rarity: 'common',
    cssEffectId: 'frame-academic-ribbon',
    description: 'Классическая строгая серебристо-синяя окантовка для прилежных учеников.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'frame-neon-cyan',
    name: 'Неоновый кибер-блеск',
    category: 'avatar_frame',
    price: 350,
    rarity: 'rare',
    cssEffectId: 'frame-neon-cyan',
    description: 'Яркое бирюзовое неоновое свечение в стиле современных IT-лабораторий.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'frame-emerald-scholar',
    name: 'Изумрудный кристалл',
    category: 'avatar_frame',
    price: 400,
    rarity: 'rare',
    cssEffectId: 'frame-emerald-scholar',
    description: 'Элегантная изумрудная рамка с мягким органическим сиянием.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'frame-cosmic-purple',
    name: 'Космическая туманность',
    category: 'avatar_frame',
    price: 800,
    rarity: 'epic',
    cssEffectId: 'frame-cosmic-purple',
    description: 'Анимированная пульсирующая фиолетово-розовая аура далеких галактик.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'frame-gold-championship',
    name: 'Золотой триумф',
    category: 'avatar_frame',
    price: 1500,
    rarity: 'legendary',
    cssEffectId: 'frame-gold-championship',
    description: 'Роскошная сияющая золотая рамка победителей олимпиад с переливающимися бликами.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'frame-cyber-glitch',
    name: 'Кибер-аномалия',
    category: 'avatar_frame',
    price: 1800,
    rarity: 'legendary',
    cssEffectId: 'frame-cyber-glitch',
    description: 'Электрическая дуговая рамка с неоновым переливом и неукротимой энергией.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },

  // --- Profile Banners (5 items) ---
  {
    id: 'banner-minimalist-slate',
    name: 'Минимализм Slate',
    category: 'profile_banner',
    price: 100,
    rarity: 'common',
    cssEffectId: 'banner-minimalist-slate',
    description: 'Строгий современный тёмный градиент в сдержанном минималистичном стиле.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'banner-science-blueprint',
    name: 'Чертёж Архимеда',
    category: 'profile_banner',
    price: 350,
    rarity: 'rare',
    cssEffectId: 'banner-science-blueprint',
    description: 'Тёмно-синий чертёжный фон с математической сеткой и неоновым фокусом.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'banner-cyberpunk-neon',
    name: 'Ночной Неополис',
    category: 'profile_banner',
    price: 750,
    rarity: 'epic',
    cssEffectId: 'banner-cyberpunk-neon',
    description: 'Контрастный фиолетово-розовый градиент ночного технологичного мегаполиса.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'banner-olympiad-gold',
    name: 'Золото Pifagor',
    category: 'profile_banner',
    price: 900,
    rarity: 'epic',
    cssEffectId: 'banner-olympiad-gold',
    description: 'Престижный геометрический паттерн с янтарно-золотым свечением школы.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'banner-cosmic-nebula',
    name: 'Звёздная Одиссея',
    category: 'profile_banner',
    price: 1600,
    rarity: 'legendary',
    cssEffectId: 'banner-cosmic-nebula',
    description: 'Глубокий космический градиент со звёздным сиянием и галактическим вихрем.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },

  // --- Titles (5 items) ---
  {
    id: 'title-novice-explorer',
    name: 'Искатель знаний',
    category: 'title',
    price: 100,
    rarity: 'common',
    cssEffectId: 'title-novice-explorer',
    description: 'Скромный, но целеустремленный исследователь новых дисциплин.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'title-problem-solver',
    name: 'Мастер решений',
    category: 'title',
    price: 300,
    rarity: 'rare',
    cssEffectId: 'title-problem-solver',
    description: 'Тот, кто щелкает сложнейшие задачи на секциях и олимпиадах.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'title-streak-champion',
    name: 'Пламенный спринтер',
    category: 'title',
    price: 450,
    rarity: 'rare',
    cssEffectId: 'title-streak-champion',
    description: 'Обладатель несгибаемой дисциплины и безупречной серии посещаемости.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'title-math-wizard',
    name: 'Архитектор алгоритмов',
    category: 'title',
    price: 700,
    rarity: 'epic',
    cssEffectId: 'title-math-wizard',
    description: 'Маг точных наук, логики и глубоких математических построений.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'title-legend-pifagor',
    name: 'Легенда Pifagor',
    category: 'title',
    price: 2000,
    rarity: 'legendary',
    cssEffectId: 'title-legend-pifagor',
    description: 'Высший статус признания за выдающиеся заслуги, упорство и верность школе.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
];

/**
 * Factory to create a ShopItem
 * @param {Partial<ShopItem>} data
 * @returns {ShopItem}
 */
export function createShopItem(data = {}) {
  return {
    id: data.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name || 'Безымянный предмет',
    category: data.category || 'avatar_frame',
    price: typeof data.price === 'number' ? data.price : 100,
    rarity: data.rarity || 'common',
    cssEffectId: data.cssEffectId || data.id || 'frame-academic-ribbon',
    description: data.description || '',
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Factory to create a UserInventoryItem
 * @param {Partial<UserInventoryItem>} data
 * @returns {UserInventoryItem}
 */
export function createUserInventoryItem(data = {}) {
  const userId = data.userId || '';
  const itemId = data.itemId || '';
  return {
    id: data.id || (userId && itemId ? `${userId}_${itemId}` : `inv-${Date.now()}`),
    userId,
    itemId,
    itemCategory: data.itemCategory || 'avatar_frame',
    isEquipped: Boolean(data.isEquipped),
    purchasedAt: data.purchasedAt || new Date().toISOString(),
  };
}
