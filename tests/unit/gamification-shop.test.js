import { describe, it, expect } from 'vitest';
import {
  createShopItem,
  createUserInventoryItem,
  STARTER_SHOP_ITEMS,
  SHOP_CATEGORIES,
  ITEM_RARITIES,
  RARITY_CONFIG,
  CSS_EFFECT_PRESETS,
} from '../../src/entities/shop/model.js';

describe('Gamification Shop & Profile Customization — Unit Tests', () => {
  describe('1. Data Models & Factory Functions', () => {
    it('creates ShopItem entity with defaults', () => {
      const item = createShopItem({
        id: 'frame-test-1',
        name: 'Тестовая рамка',
        category: 'avatar_frame',
        price: 350,
        rarity: 'rare',
        cssEffectId: 'frame-neon-cyan',
        description: 'Красивая неоновая рамка',
      });

      expect(item.id).toBe('frame-test-1');
      expect(item.name).toBe('Тестовая рамка');
      expect(item.category).toBe('avatar_frame');
      expect(item.price).toBe(350);
      expect(item.rarity).toBe('rare');
      expect(item.cssEffectId).toBe('frame-neon-cyan');
      expect(item.isActive).toBe(true);
      expect(item.createdAt).toBeDefined();
    });

    it('creates UserInventoryItem entity with defaults', () => {
      const inv = createUserInventoryItem({
        userId: 'student-42',
        itemId: 'frame-neon-cyan',
        itemCategory: 'avatar_frame',
        isEquipped: true,
      });

      expect(inv.id).toBe('student-42_frame-neon-cyan');
      expect(inv.userId).toBe('student-42');
      expect(inv.itemId).toBe('frame-neon-cyan');
      expect(inv.itemCategory).toBe('avatar_frame');
      expect(inv.isEquipped).toBe(true);
      expect(inv.purchasedAt).toBeDefined();
    });
  });

  describe('2. Starter Shop Catalog (10-15+ items with 3 categories & rarities)', () => {
    it('has at least 15 starter items defined', () => {
      expect(STARTER_SHOP_ITEMS.length).toBeGreaterThanOrEqual(15);
    });

    it('contains all 3 cosmetic categories: avatar_frame, profile_banner, title', () => {
      const categories = new Set(STARTER_SHOP_ITEMS.map((i) => i.category));
      expect(categories.has(SHOP_CATEGORIES.AVATAR_FRAME)).toBe(true);
      expect(categories.has(SHOP_CATEGORIES.PROFILE_BANNER)).toBe(true);
      expect(categories.has(SHOP_CATEGORIES.TITLE)).toBe(true);
    });

    it('has 5-6 avatar frames, 4-5 banners, 4-5 titles', () => {
      const frames = STARTER_SHOP_ITEMS.filter((i) => i.category === SHOP_CATEGORIES.AVATAR_FRAME);
      const banners = STARTER_SHOP_ITEMS.filter((i) => i.category === SHOP_CATEGORIES.PROFILE_BANNER);
      const titles = STARTER_SHOP_ITEMS.filter((i) => i.category === SHOP_CATEGORIES.TITLE);

      expect(frames.length).toBeGreaterThanOrEqual(5);
      expect(banners.length).toBeGreaterThanOrEqual(4);
      expect(titles.length).toBeGreaterThanOrEqual(4);
    });

    it('prices are balanced between 100 and 2000 coins', () => {
      STARTER_SHOP_ITEMS.forEach((item) => {
        expect(item.price).toBeGreaterThanOrEqual(100);
        expect(item.price).toBeLessThanOrEqual(2000);
        expect(typeof item.price).toBe('number');
        expect(item.isActive).toBe(true);
      });
    });

    it('all rarities (common, rare, epic, legendary) are represented and configured', () => {
      const raritiesInCatalog = new Set(STARTER_SHOP_ITEMS.map((i) => i.rarity));
      expect(raritiesInCatalog.has(ITEM_RARITIES.COMMON)).toBe(true);
      expect(raritiesInCatalog.has(ITEM_RARITIES.RARE)).toBe(true);
      expect(raritiesInCatalog.has(ITEM_RARITIES.EPIC)).toBe(true);
      expect(raritiesInCatalog.has(ITEM_RARITIES.LEGENDARY)).toBe(true);

      Object.values(ITEM_RARITIES).forEach((rarity) => {
        expect(RARITY_CONFIG[rarity]).toBeDefined();
        expect(RARITY_CONFIG[rarity].color).toBeDefined();
        expect(RARITY_CONFIG[rarity].label).toBeDefined();
      });
    });

    it('CSS effect presets are defined for each category', () => {
      expect(CSS_EFFECT_PRESETS.avatar_frame.length).toBeGreaterThanOrEqual(5);
      expect(CSS_EFFECT_PRESETS.profile_banner.length).toBeGreaterThanOrEqual(4);
      expect(CSS_EFFECT_PRESETS.title.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('3. Purchase & Equipment Logic Simulation', () => {
    it('validates coin deduction on purchase simulation', () => {
      const currentCoins = 500;
      const item = STARTER_SHOP_ITEMS.find((i) => i.id === 'frame-neon-cyan'); // 350 coins

      expect(item).toBeDefined();
      const canAfford = currentCoins >= item.price;
      expect(canAfford).toBe(true);

      const remainingCoins = currentCoins - item.price;
      expect(remainingCoins).toBe(150);
    });

    it('rejects purchase if user has insufficient coins', () => {
      const currentCoins = 100;
      const expensiveItem = STARTER_SHOP_ITEMS.find((i) => i.rarity === 'legendary'); // 1500+ coins

      expect(expensiveItem).toBeDefined();
      const canAfford = currentCoins >= expensiveItem.price;
      expect(canAfford).toBe(false);
    });

    it('simulates exclusive per-category equipping (only one active frame at a time)', () => {
      let inventory = [
        createUserInventoryItem({ userId: 'u1', itemId: 'frame-neon-cyan', itemCategory: 'avatar_frame', isEquipped: true }),
        createUserInventoryItem({ userId: 'u1', itemId: 'frame-gold-championship', itemCategory: 'avatar_frame', isEquipped: false }),
        createUserInventoryItem({ userId: 'u1', itemId: 'title-legend-pifagor', itemCategory: 'title', isEquipped: true }),
      ];

      // Student equips frame-gold-championship
      const targetCategory = 'avatar_frame';
      const newEquippedId = 'frame-gold-championship';

      inventory = inventory.map((inv) => {
        if (inv.itemCategory === targetCategory) {
          return { ...inv, isEquipped: inv.itemId === newEquippedId };
        }
        return inv;
      });

      const equippedFrames = inventory.filter((i) => i.itemCategory === 'avatar_frame' && i.isEquipped);
      const equippedTitles = inventory.filter((i) => i.itemCategory === 'title' && i.isEquipped);

      expect(equippedFrames.length).toBe(1);
      expect(equippedFrames[0].itemId).toBe('frame-gold-championship');
      // Title remains unaffected
      expect(equippedTitles.length).toBe(1);
      expect(equippedTitles[0].itemId).toBe('title-legend-pifagor');
    });
  });
});
