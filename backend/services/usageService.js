import pool from '../db/client.js';

const MAX_DAILY_CALLS = 6;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const getOrCreateUser = async (auth0Id, email, name) => {
  const existing = await pool.query(
    'SELECT * FROM users WHERE auth0_id = $1',
    [auth0Id]
  );

  if (existing.rows.length > 0) return existing.rows[0];

  const created = await pool.query(
    `INSERT INTO users (auth0_id, email, name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [auth0Id, email, name]
  );

  return created.rows[0];
};

export const checkAndIncrementUsage = async (auth0Id, email, name) => {
  const user = await getOrCreateUser(auth0Id, email, name);

  if (user.is_admin) return { allowed: true, remaining: Infinity };

  const now = Date.now();
  const resetDue = now - new Date(user.daily_call_reset_at).getTime() >= RESET_INTERVAL_MS;

  if (resetDue) {
    await pool.query(
      `UPDATE users
       SET daily_call_count = 1,
           daily_call_reset_at = NOW(),
           total_call_count = total_call_count + 1,
           last_active_at = NOW()
       WHERE auth0_id = $1`,
      [auth0Id]
    );
    return { allowed: true, remaining: MAX_DAILY_CALLS - 1 };
  }

  if (user.daily_call_count >= MAX_DAILY_CALLS) {
    return {
      allowed: false,
      remaining: 0,
      resetsAt: new Date(new Date(user.daily_call_reset_at).getTime() + RESET_INTERVAL_MS),
    };
  }

  await pool.query(
    `UPDATE users
     SET daily_call_count = daily_call_count + 1,
         total_call_count = total_call_count + 1,
         last_active_at = NOW()
     WHERE auth0_id = $1`,
    [auth0Id]
  );

  return {
    allowed: true,
    remaining: MAX_DAILY_CALLS - (user.daily_call_count + 1),
  };
};

export const getUsage = async (auth0Id) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE auth0_id = $1',
    [auth0Id]
  );

  if (result.rows.length === 0) return { ai_calls: 0, remaining: MAX_DAILY_CALLS };

  const user = result.rows[0];
  const resetDue = Date.now() - new Date(user.daily_call_reset_at).getTime() >= RESET_INTERVAL_MS;

  if (resetDue) return { ai_calls: 0, remaining: MAX_DAILY_CALLS };

  return {
    ai_calls: user.daily_call_count,
    remaining: Math.max(0, MAX_DAILY_CALLS - user.daily_call_count),
    total_calls: user.total_call_count,
  };
};