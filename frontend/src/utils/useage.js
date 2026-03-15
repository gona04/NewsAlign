const STORAGE_KEY = 'fact_checker_usage';
const MAX_CALLS = 4;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getUsageData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, firstCallAt: null };
    return JSON.parse(raw);
  } catch {
    return { count: 0, firstCallAt: null };
  }
}

export function hasReachedLimit() {
  const { count, firstCallAt } = getUsageData();
  if (!firstCallAt) return false;

  const elapsed = Date.now() - firstCallAt;
  if (elapsed >= RESET_INTERVAL_MS) {
    resetUsage();
    return false;
  }

  return count >= MAX_CALLS;
}

export function incrementUsage() {
  const { count, firstCallAt } = getUsageData();
  const now = Date.now();

  const isExpired = firstCallAt && (now - firstCallAt) >= RESET_INTERVAL_MS;

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    count: isExpired ? 1 : count + 1,
    firstCallAt: isExpired || !firstCallAt ? now : firstCallAt,
  }));
}

export function getRemainingCalls() {
  const { count, firstCallAt } = getUsageData();
  if (!firstCallAt) return MAX_CALLS;

  const elapsed = Date.now() - firstCallAt;
  if (elapsed >= RESET_INTERVAL_MS) return MAX_CALLS;

  return Math.max(0, MAX_CALLS - count);
}

export function getResetTime() {
  const { firstCallAt } = getUsageData();
  if (!firstCallAt) return null;
  return new Date(firstCallAt + RESET_INTERVAL_MS);
}

export function resetUsage() {
  localStorage.removeItem(STORAGE_KEY);
}