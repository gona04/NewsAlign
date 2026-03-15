import pool from '../db/client.js';
import {MAX_DAILY_CALLS} from '../utils/constants.js'; 

const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const getOrCreateUser = async (auth0Id, email, name) => {
  const existing = await pool.query(
    'SELECT * FROM users WHERE auth0_id = $1',
    [auth0Id]
  );

  if (existing.rows.length > 0) return existing.rows[0];

  const created = await pool.query(
    `INSERT INTO users (auth0_id, email, name, role)
     VALUES ($1, $2, $3, 'user')
     RETURNING *`,
    [auth0Id, email, name]
  );

  return created.rows[0];
};

export const getDailyCallCount = async (auth0Id) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count
     FROM user_activity
     WHERE auth0_id = $1
     AND created_at >= NOW() - INTERVAL '24 hours'`,
    [auth0Id]
  );
  return parseInt(result.rows[0].count);
};

export const getTotalCallCount = async (auth0Id) => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM user_activity WHERE auth0_id = $1',
    [auth0Id]
  );
  return parseInt(result.rows[0].count);
};

export const checkAndIncrementUsage = async (auth0Id, email, name) => {
  const user = await getOrCreateUser(auth0Id, email, name);

  if (user.role === 'admin' || user.role === 'moderator') {
    return { allowed: true, remaining: Infinity };
  }

  const dailyCount = await getDailyCallCount(auth0Id);

  if (dailyCount >= MAX_DAILY_CALLS) {
    return {
      allowed: false,
      remaining: 0,
      resetsAt: new Date(Date.now() + RESET_INTERVAL_MS),
    };
  }

  return {
    allowed: true,
    remaining: MAX_DAILY_CALLS - dailyCount - 1,
  };
};

export const logActivity = async (auth0Id, query, mode, response = null) => {
  await pool.query(
    `INSERT INTO user_activity (auth0_id, query, mode, response)
     VALUES ($1, $2, $3, $4)`,
    [auth0Id, query, mode, response]
  );
};

export const getUsage = async (auth0Id) => {
  const userResult = await pool.query(
    'SELECT * FROM users WHERE auth0_id = $1',
    [auth0Id]
  );

  if (userResult.rows.length === 0) {
    return { ai_calls: 0, remaining: MAX_DAILY_CALLS, role: 'user' };
  }

  const user = userResult.rows[0];
  const dailyCount = await getDailyCallCount(auth0Id);
  const totalCount = await getTotalCallCount(auth0Id);

  return {
    ai_calls: dailyCount,
    remaining: Math.max(0, MAX_DAILY_CALLS - dailyCount),
    total_calls: totalCount,
    role: user.role,
  };
};