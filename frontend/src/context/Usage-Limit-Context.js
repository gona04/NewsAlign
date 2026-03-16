import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const UsageLimitContext = createContext();

export const MAX_DAILY_CALLS = 4;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;
const getStorageKey = (userId) => `fact_checker_usage_${userId}`;

// ─── localStorage utilities ───────────────────────────────────────

function getUsageData(userId) {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return { count: 0, firstCallAt: null };
    return JSON.parse(raw);
  } catch {
    return { count: 0, firstCallAt: null };
  }
}

function saveUsageData(userId, data) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
}

function clearUsageData(userId) {
  localStorage.removeItem(getStorageKey(userId));
}

function isExpired(firstCallAt) {
  if (!firstCallAt) return false;
  return Date.now() - firstCallAt >= RESET_INTERVAL_MS;
}

function calculateRemaining(userId) {
  if (!userId) return MAX_DAILY_CALLS;
  const { count, firstCallAt } = getUsageData(userId);
  if (!firstCallAt || isExpired(firstCallAt)) return MAX_DAILY_CALLS;
  return Math.max(0, MAX_DAILY_CALLS - count);
}

function calculateResetTime(userId) {
  if (!userId) return null;
  const { firstCallAt } = getUsageData(userId);
  if (!firstCallAt) return null;
  return new Date(firstCallAt + RESET_INTERVAL_MS);
}

// ─── Provider ─────────────────────────────────────────────────────

export function UsageLimitProvider({ children }) {
  const { user } = useAuth0();
  const userId = user?.sub || null;
  const roles = user?.['https://fact-checker/roles'] || [];
  const isAdmin = roles.includes('admin');

  const [remaining, setRemaining] = useState(MAX_DAILY_CALLS);
  const [resetTime, setResetTime] = useState(null);

  useEffect(() => {
    if (!userId) return;
    if (isAdmin) {
      setRemaining(Infinity);
      setResetTime(null);
      return;
    }

    // Auto-reset if 24 hours have passed
    const { firstCallAt } = getUsageData(userId);
    if (firstCallAt && isExpired(firstCallAt)) {
      clearUsageData(userId);
    }

    setRemaining(calculateRemaining(userId));
    setResetTime(calculateResetTime(userId));
  }, [userId, isAdmin]);

  const checkLimit = () => {
    if (isAdmin || !userId) return false;
    const { count, firstCallAt } = getUsageData(userId);
    if (!firstCallAt || isExpired(firstCallAt)) return false;
    return count >= MAX_DAILY_CALLS;
  };

  const consumeCall = () => {
    if (isAdmin || !userId) return;

    const { count, firstCallAt } = getUsageData(userId);
    const now = Date.now();
    const expired = firstCallAt && isExpired(firstCallAt);

    saveUsageData(userId, {
      count: expired ? 1 : count + 1,
      firstCallAt: expired || !firstCallAt ? now : firstCallAt,
    });

    setRemaining(calculateRemaining(userId));
    setResetTime(calculateResetTime(userId));
  };

  const resetLimit = () => {
    if (!userId) return;
    clearUsageData(userId);
    setRemaining(MAX_DAILY_CALLS);
    setResetTime(null);
  };

  return (
    <UsageLimitContext.Provider value={{
      MAX_DAILY_CALLS,
      remaining,
      resetTime,
      isAdmin,
      userId,
      checkLimit,
      consumeCall,
      resetLimit,
    }}>
      {children}
    </UsageLimitContext.Provider>
  );
}

export function useUsageLimit() {
  return useContext(UsageLimitContext);
}