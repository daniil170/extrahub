import { describe, it, expect } from 'vitest';
import {
  createSeason,
  createLeagueDivision,
  createLeagueMembership,
  LEAGUE_CONFIG,
} from '../../src/entities/league/model.js';
import {
  getNextRank,
  shuffleArray,
  splitIntoGroups,
  LEAGUE_CONSTANTS,
} from '../../functions/src/shared/leagues.js';

describe('Gamification Leagues & Divisional Rankings — Unit Tests', () => {
  describe('1. Models & Factory Functions', () => {
    it('creates Season entity with active status and default dates', () => {
      const season = createSeason({
        id: 'season-2026-q3',
        name: 'Осенний сезон 2026',
      });

      expect(season.id).toBe('season-2026-q3');
      expect(season.name).toBe('Осенний сезон 2026');
      expect(season.status).toBe('active');
      expect(season.startDate).toBeDefined();
      expect(season.endDate).toBeDefined();
      expect(season.createdAt).toBeDefined();
    });

    it('creates LeagueDivision with proper title and rank metadata', () => {
      const division = createLeagueDivision({
        seasonId: 'season-2026-q3',
        rank: 'gold',
        groupNumber: 2,
      });

      expect(division.id).toBe('season-2026-q3_gold_group_2');
      expect(division.seasonId).toBe('season-2026-q3');
      expect(division.rank).toBe('gold');
      expect(division.groupNumber).toBe(2);
      expect(division.name).toContain('Золотая лига');
      expect(division.name).toContain('Группа 2');
    });

    it('creates LeagueMembership with seasonal XP counter starting at 0', () => {
      const membership = createLeagueMembership({
        seasonId: 'season-2026-q3',
        userId: 'student-123',
        rank: 'bronze',
        groupNumber: 1,
      });

      expect(membership.userId).toBe('student-123');
      expect(membership.xpEarnedThisSeason).toBe(0);
      expect(membership.rank).toBe('bronze');
      expect(membership.useRealName).toBe(true);
      expect(membership.pseudonym).toBe('');
    });
  });

  describe('2. Promotion & Relegation Rank Calculations', () => {
    it('promotes ranks correctly upwards (Bronze -> Silver -> Gold -> Diamond)', () => {
      expect(getNextRank('bronze', 'promote')).toBe('silver');
      expect(getNextRank('silver', 'promote')).toBe('gold');
      expect(getNextRank('gold', 'promote')).toBe('diamond');
      // Diamond champions remain in Diamond
      expect(getNextRank('diamond', 'promote')).toBe('diamond');
    });

    it('relegates ranks correctly downwards (Diamond -> Gold -> Silver -> Bronze)', () => {
      expect(getNextRank('diamond', 'relegate')).toBe('gold');
      expect(getNextRank('gold', 'relegate')).toBe('silver');
      expect(getNextRank('silver', 'relegate')).toBe('bronze');
      // Lowest Bronze rank remains in Bronze
      expect(getNextRank('bronze', 'relegate')).toBe('bronze');
    });

    it('maintains current rank on maintain action', () => {
      expect(getNextRank('bronze', 'maintain')).toBe('bronze');
      expect(getNextRank('silver', 'maintain')).toBe('silver');
      expect(getNextRank('gold', 'maintain')).toBe('gold');
      expect(getNextRank('diamond', 'maintain')).toBe('diamond');
    });
  });

  describe('3. Group Splitting & Random Shuffling (Max 30 per Group)', () => {
    it('keeps <= 30 students in a single group', () => {
      const students = Array.from({ length: 25 }, (_, i) => `student-${i + 1}`);
      const groups = splitIntoGroups(students, 30);

      expect(groups.length).toBe(1);
      expect(groups[0].length).toBe(25);
    });

    it('splits > 30 students into multiple balanced groups (e.g. 50 students -> 2 groups of 25)', () => {
      const students = Array.from({ length: 50 }, (_, i) => `student-${i + 1}`);
      const groups = splitIntoGroups(students, 30);

      expect(groups.length).toBe(2);
      expect(groups[0].length).toBe(25);
      expect(groups[1].length).toBe(25);
      expect(groups.flat().length).toBe(50);
    });

    it('randomly shuffles array without losing any elements', () => {
      const original = Array.from({ length: 20 }, (_, i) => `student-${i + 1}`);
      const shuffled = shuffleArray(original);

      expect(shuffled.length).toBe(original.length);
      expect(new Set(shuffled).size).toBe(original.length);
      original.forEach((id) => {
        expect(shuffled).toContain(id);
      });
    });
  });

  describe('4. End of Season Division Simulation', () => {
    it('identifies top 5 for promotion and bottom 5 for relegation', () => {
      // Create division of 15 students with different XP
      const members = Array.from({ length: 15 }, (_, i) => ({
        userId: `student-${i + 1}`,
        xpEarnedThisSeason: (15 - i) * 50, // student-1 has 750, student-15 has 50
        rank: 'silver',
      }));

      // Sort by XP descending
      members.sort((a, b) => b.xpEarnedThisSeason - a.xpEarnedThisSeason);

      const top5 = members.slice(0, 5);
      const bottom5 = members.slice(-5);
      const middle5 = members.slice(5, 10);

      expect(top5.map((m) => m.userId)).toEqual([
        'student-1',
        'student-2',
        'student-3',
        'student-4',
        'student-5',
      ]);
      expect(bottom5.map((m) => m.userId)).toEqual([
        'student-11',
        'student-12',
        'student-13',
        'student-14',
        'student-15',
      ]);

      // Top 5 promote to Gold
      top5.forEach((m) => {
        expect(getNextRank(m.rank, 'promote')).toBe('gold');
      });

      // Bottom 5 relegate to Bronze
      bottom5.forEach((m) => {
        expect(getNextRank(m.rank, 'relegate')).toBe('bronze');
      });

      // Middle 5 stay in Silver
      middle5.forEach((m) => {
        expect(getNextRank(m.rank, 'maintain')).toBe('silver');
      });
    });
  });

  describe('5. Anonymity & Pseudonyms', () => {
    it('displays pseudonym when useRealName is false', () => {
      const member = createLeagueMembership({
        userId: 'student-1',
        useRealName: false,
        pseudonym: 'CyberFox',
      });

      const displayedName = member.useRealName ? 'Алихан Сейткали' : member.pseudonym || 'Инкогнито';
      expect(displayedName).toBe('CyberFox');
    });

    it('displays real name when useRealName is true', () => {
      const member = createLeagueMembership({
        userId: 'student-1',
        useRealName: true,
        pseudonym: 'CyberFox',
      });

      const displayedName = member.useRealName ? 'Алихан Сейткали' : member.pseudonym || 'Инкогнито';
      expect(displayedName).toBe('Алихан Сейткали');
    });
  });
});
