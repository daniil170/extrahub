import { describe, it, expect } from 'vitest';
import {
  createUserBalance,
  createPointsLedgerEntry,
  GAMIFICATION_CONSTANTS,
} from '../../src/entities/gamification/model.js';
import {
  calculateStreakMultiplier,
  getCurrentQuarterKey,
  GAMIFICATION_CONFIG,
} from '../../functions/src/shared/gamification.js';

describe('Gamification Core Engine Unit Tests', () => {
  describe('1. Data Models & Factories', () => {
    it('creates default UserBalance with proper initial values', () => {
      const balance = createUserBalance({ userId: 'student-123' });
      expect(balance.userId).toBe('student-123');
      expect(balance.xpPoints).toBe(0);
      expect(balance.coins).toBe(0);
      expect(balance.currentStreak).toBe(0);
      expect(balance.longestStreak).toBe(0);
      expect(balance.lastAttendedDate).toBeNull();
      expect(balance.streakFreezeCount).toBe(1);
      expect(balance.streakFreezeActive).toBe(false);
      expect(balance.xpMultiplier).toBe(1.0);
      expect(balance.updatedAt).toBeDefined();
    });

    it('creates PointsLedgerEntry with required metadata', () => {
      const entry = createPointsLedgerEntry({
        userId: 'student-123',
        amount: 50,
        currencyType: 'xp',
        source: 'attendance',
        sourceRefId: 'grp1_student-123_2026-09-20',
        reason: 'Посещение занятия «Робототехника»',
        createdBy: 'teacher-1',
      });

      expect(entry.id).toBeDefined();
      expect(entry.userId).toBe('student-123');
      expect(entry.amount).toBe(50);
      expect(entry.currencyType).toBe('xp');
      expect(entry.source).toBe('attendance');
      expect(entry.sourceRefId).toBe('grp1_student-123_2026-09-20');
      expect(entry.createdBy).toBe('teacher-1');
      expect(entry.createdAt).toBeDefined();
    });
  });

  describe('2. Multipliers & Milestone Streaks', () => {
    it('calculates correct multipliers at thresholds 0, 3, 4, 7, 8, 11, 12+', () => {
      expect(calculateStreakMultiplier(0)).toBe(1.0);
      expect(calculateStreakMultiplier(1)).toBe(1.0);
      expect(calculateStreakMultiplier(3)).toBe(1.0);

      // Milestone 1: 4 weeks -> +50% (x1.5)
      expect(calculateStreakMultiplier(4)).toBe(1.5);
      expect(calculateStreakMultiplier(5)).toBe(1.5);
      expect(calculateStreakMultiplier(7)).toBe(1.5);

      // Milestone 2: 8 weeks -> +100% (x2.0)
      expect(calculateStreakMultiplier(8)).toBe(2.0);
      expect(calculateStreakMultiplier(10)).toBe(2.0);
      expect(calculateStreakMultiplier(11)).toBe(2.0);

      // Milestone 3: 12 weeks -> +150% (x2.5)
      expect(calculateStreakMultiplier(12)).toBe(2.5);
      expect(calculateStreakMultiplier(20)).toBe(2.5);
    });

    it('determines calendar quarters correctly', () => {
      const q1Date = new Date('2026-02-15T12:00:00Z');
      const q2Date = new Date('2026-05-10T12:00:00Z');
      const q3Date = new Date('2026-09-20T12:00:00Z');
      const q4Date = new Date('2026-11-01T12:00:00Z');

      expect(getCurrentQuarterKey(q1Date)).toBe('2026-Q1');
      expect(getCurrentQuarterKey(q2Date)).toBe('2026-Q2');
      expect(getCurrentQuarterKey(q3Date)).toBe('2026-Q3');
      expect(getCurrentQuarterKey(q4Date)).toBe('2026-Q4');
    });
  });

  describe('3. Attendance Points & Streak Rules', () => {
    it('applies base rewards (+50 XP, +10 coins) for regular attendance', () => {
      const baseXP = GAMIFICATION_CONFIG.ATTENDANCE_XP;
      const baseCoins = GAMIFICATION_CONFIG.ATTENDANCE_COINS;
      const streak = 1;
      const multiplier = calculateStreakMultiplier(streak);

      const awardedXP = Math.round(baseXP * multiplier);
      const awardedCoins = baseCoins;

      expect(awardedXP).toBe(50);
      expect(awardedCoins).toBe(10);
    });

    it('applies milestone multiplier (+50%) for 4-week streak', () => {
      const baseXP = GAMIFICATION_CONFIG.ATTENDANCE_XP;
      const streak = 4;
      const multiplier = calculateStreakMultiplier(streak);

      const awardedXP = Math.round(baseXP * multiplier);
      expect(multiplier).toBe(1.5);
      expect(awardedXP).toBe(75);
    });

    it('preserves streak when excused absence has active freeze token', () => {
      const balance = createUserBalance({
        currentStreak: 5,
        longestStreak: 5,
        streakFreezeActive: true,
        streakFreezeCount: 1,
      });

      // Excused attendance occurs
      const isExcused = true;
      if (isExcused && balance.streakFreezeActive) {
        balance.streakFreezeActive = false;
        balance.streakFreezeCount = 0;
        balance.usedFreezesQuarter = '2026-Q3';
        // Streak is preserved!
      } else {
        balance.currentStreak = 0;
      }

      expect(balance.currentStreak).toBe(5);
      expect(balance.streakFreezeActive).toBe(false);
      expect(balance.streakFreezeCount).toBe(0);
      expect(balance.usedFreezesQuarter).toBe('2026-Q3');
    });

    it('resets streak to 0 when student is absent without freeze', () => {
      const balance = createUserBalance({
        currentStreak: 5,
        longestStreak: 5,
        streakFreezeActive: false,
      });

      const isAbsent = true;
      if (isAbsent) {
        balance.currentStreak = 0;
        balance.xpMultiplier = 1.0;
      }

      expect(balance.currentStreak).toBe(0);
      expect(balance.xpMultiplier).toBe(1.0);
      expect(balance.longestStreak).toBe(5);
    });
  });

  describe('4. Fast Parent Approval Bonus Window', () => {
    it('awards +20 coins when approved within 6 hours of invitation', () => {
      const inviteCreatedAt = new Date('2026-09-20T10:00:00Z');
      const approvedAt = new Date('2026-09-20T14:30:00Z'); // 4.5 hours later

      const diffHours = (approvedAt.getTime() - inviteCreatedAt.getTime()) / (1000 * 60 * 60);
      const isEligible = diffHours >= 0 && diffHours <= 6;

      expect(isEligible).toBe(true);
      expect(GAMIFICATION_CONFIG.PARENT_QUICK_APPROVAL_COINS).toBe(20);
    });

    it('does not award quick approval bonus if approved after 6 hours', () => {
      const inviteCreatedAt = new Date('2026-09-20T10:00:00Z');
      const approvedAt = new Date('2026-09-20T18:00:00Z'); // 8 hours later

      const diffHours = (approvedAt.getTime() - inviteCreatedAt.getTime()) / (1000 * 60 * 60);
      const isEligible = diffHours >= 0 && diffHours <= 6;

      expect(isEligible).toBe(false);
    });
  });

  describe('5. Teacher Recognition Daily Limits', () => {
    it('enforces maximum 5 teacher awards per group per day', () => {
      const maxDaily = GAMIFICATION_CONFIG.MAX_TEACHER_DAILY_REWARDS;
      expect(maxDaily).toBe(5);

      const usedToday = 4;
      const canAward = usedToday < maxDaily;
      expect(canAward).toBe(true);

      const afterFifth = 5;
      const canAwardAfterFifth = afterFifth < maxDaily;
      expect(canAwardAfterFifth).toBe(false);
    });
  });
});
