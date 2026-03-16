import {
  getUsageData,
  hasReachedLimit,
  incrementUsage,
  getRemainingCalls,
  getResetTime,
  resetUsage,
} from '../../frontend/src/utils/usageLimit.js';

const MAX_CALLS = 4;
const userId = 'test-user-123';

describe('usageLimit localStorage utilities', () => {

  beforeEach(() => localStorage.clear());

  // ─── getUsageData ──────────────────────────────────────────────

  describe('getUsageData', () => {
    it('PASS — returns defaults for new user', () => {
      const data = getUsageData(userId);
      expect(data.count).toBe(0);
      expect(data.firstCallAt).toBeNull();
    });

    it('PASS — returns stored values correctly', () => {
      const stored = { count: 2, firstCallAt: Date.now() };
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify(stored));
      expect(getUsageData(userId).count).toBe(2);
    });

    it('FAIL — returns defaults for corrupted data', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, 'corrupted');
      const data = getUsageData(userId);
      expect(data.count).toBe(0);
    });

    it('FAIL — count should never be negative', () => {
      const data = getUsageData(userId);
      expect(data.count).not.toBeLessThan(0);
    });
  });

  // ─── hasReachedLimit ───────────────────────────────────────────

  describe('hasReachedLimit', () => {
    it('PASS — returns false for brand new user', () => {
      expect(hasReachedLimit(userId, MAX_CALLS)).toBe(false);
    });

    it('PASS — returns false when under limit', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: 2, firstCallAt: Date.now(),
      }));
      expect(hasReachedLimit(userId, MAX_CALLS)).toBe(false);
    });

    it('PASS — returns true when at exactly the limit', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: MAX_CALLS, firstCallAt: Date.now(),
      }));
      expect(hasReachedLimit(userId, MAX_CALLS)).toBe(true);
    });

    it('PASS — resets and returns false after 24 hours', () => {
      const yesterday = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: MAX_CALLS, firstCallAt: yesterday,
      }));
      expect(hasReachedLimit(userId, MAX_CALLS)).toBe(false);
    });

    it('FAIL — should not return true for count below limit', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: MAX_CALLS - 1, firstCallAt: Date.now(),
      }));
      expect(hasReachedLimit(userId, MAX_CALLS)).not.toBe(true);
    });
  });

  // ─── incrementUsage ────────────────────────────────────────────

  describe('incrementUsage', () => {
    it('PASS — increments count from 0 to 1 for new user', () => {
      incrementUsage(userId);
      expect(getUsageData(userId).count).toBe(1);
    });

    it('PASS — increments existing count correctly', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: 2, firstCallAt: Date.now(),
      }));
      incrementUsage(userId);
      expect(getUsageData(userId).count).toBe(3);
    });

    it('PASS — resets to 1 after 24 hours have passed', () => {
      const yesterday = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: 4, firstCallAt: yesterday,
      }));
      incrementUsage(userId);
      expect(getUsageData(userId).count).toBe(1);
    });

    it('PASS — stores data separately per user', () => {
      incrementUsage('user-a');
      incrementUsage('user-a');
      incrementUsage('user-b');
      expect(getUsageData('user-a').count).toBe(2);
      expect(getUsageData('user-b').count).toBe(1);
    });

    it('FAIL — count should not decrease after increment', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: 2, firstCallAt: Date.now(),
      }));
      const before = getUsageData(userId).count;
      incrementUsage(userId);
      expect(getUsageData(userId).count).toBeGreaterThan(before);
    });
  });

  // ─── getRemainingCalls ─────────────────────────────────────────

  describe('getRemainingCalls', () => {
    it('PASS — returns MAX_CALLS for new user', () => {
      expect(getRemainingCalls(userId, MAX_CALLS)).toBe(MAX_CALLS);
    });

    it('PASS — returns correct remaining count', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: 3, firstCallAt: Date.now(),
      }));
      expect(getRemainingCalls(userId, MAX_CALLS)).toBe(1);
    });

    it('PASS — returns 0 when limit is reached', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: MAX_CALLS, firstCallAt: Date.now(),
      }));
      expect(getRemainingCalls(userId, MAX_CALLS)).toBe(0);
    });

    it('PASS — resets to MAX_CALLS after 24 hours', () => {
      const yesterday = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: MAX_CALLS, firstCallAt: yesterday,
      }));
      expect(getRemainingCalls(userId, MAX_CALLS)).toBe(MAX_CALLS);
    });

    it('FAIL — remaining should never be negative', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: MAX_CALLS + 10, firstCallAt: Date.now(),
      }));
      expect(getRemainingCalls(userId, MAX_CALLS)).toBeGreaterThanOrEqual(0);
    });

    it('FAIL — remaining should not exceed MAX_CALLS', () => {
      expect(getRemainingCalls(userId, MAX_CALLS)).not.toBeGreaterThan(MAX_CALLS);
    });
  });

  // ─── resetUsage ────────────────────────────────────────────────

  describe('resetUsage', () => {
    it('PASS — clears usage data for user', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: 3, firstCallAt: Date.now(),
      }));
      resetUsage(userId);
      expect(getUsageData(userId).count).toBe(0);
    });

    it('PASS — only clears data for specified user', () => {
      localStorage.setItem(`fact_checker_usage_user-a`, JSON.stringify({ count: 2, firstCallAt: Date.now() }));
      localStorage.setItem(`fact_checker_usage_user-b`, JSON.stringify({ count: 3, firstCallAt: Date.now() }));
      resetUsage('user-a');
      expect(getUsageData('user-a').count).toBe(0);
      expect(getUsageData('user-b').count).toBe(3);
    });

    it('FAIL — after reset, hasReachedLimit should return false', () => {
      localStorage.setItem(`fact_checker_usage_${userId}`, JSON.stringify({
        count: MAX_CALLS, firstCallAt: Date.now(),
      }));
      resetUsage(userId);
      expect(hasReachedLimit(userId, MAX_CALLS)).toBe(false);
    });
  });
});