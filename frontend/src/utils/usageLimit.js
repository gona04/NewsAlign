import {MAX_DAILY_CALLS} from './constant';

const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

const getStorageKey = (userId) => `fact_checker_usage_${userId}`;

export function getUsageData(userId) {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return { count: 0, firstCallAt: null };
    return JSON.parse(raw);
  } catch {
    return { count: 0, firstCallAt: null };
  }
}

export function hasReachedLimit(userId) {
  const { count, firstCallAt } = getUsageData(userId);
  if (!firstCallAt) return false;
  const elapsed = Date.now() - firstCallAt;
  if (elapsed >= RESET_INTERVAL_MS) {
    resetUsage(userId);
    return false;
  }
  return count >= MAX_DAILY_CALLS;
}

export function incrementUsage(userId) {
  const { count, firstCallAt } = getUsageData(userId);
  const now = Date.now();
  const isExpired = firstCallAt && (now - firstCallAt) >= RESET_INTERVAL_MS;
  localStorage.setItem(getStorageKey(userId), JSON.stringify({
    count: isExpired ? 1 : count + 1,
    firstCallAt: isExpired || !firstCallAt ? now : firstCallAt,
  }));
}

export function getRemainingCalls(userId) {
  const { count, firstCallAt } = getUsageData(userId);
  if (!firstCallAt) return MAX_DAILY_CALLS;
  const elapsed = Date.now() - firstCallAt;
  if (elapsed >= RESET_INTERVAL_MS) return MAX_DAILY_CALLS;
  return Math.max(0, MAX_DAILY_CALLS - count);
}

export function getResetTime(userId) {
  const { firstCallAt } = getUsageData(userId);
  if (!firstCallAt) return null;
  return new Date(firstCallAt + RESET_INTERVAL_MS);
}

export function resetUsage(userId) {
  localStorage.removeItem(getStorageKey(userId));
}