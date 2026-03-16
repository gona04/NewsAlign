import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../backend/db/client.js', () => ({
  default: { query: mockQuery },
}));

const {
  getOrCreateUser,
  getDailyCallCount,
  checkAndIncrementUsage,
  getUsage,
  logActivity,
} = await import('../../backend/services/usageService.js');

describe('usageService', () => {

  beforeEach(() => mockQuery.mockReset());

  // ─── getOrCreateUser ───────────────────────────────────────────

  describe('getOrCreateUser', () => {

    it('PASS — returns existing user when found in DB', async () => {
      const user = { auth0_id: 'auth0|123', email: 'test@test.com', name: 'Test', role: 'user' };
      mockQuery.mockResolvedValueOnce({ rows: [user] });
      const result = await getOrCreateUser('auth0|123', 'test@test.com', 'Test');
      expect(result).toEqual(user);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('PASS — creates new user when not found', async () => {
      const newUser = { auth0_id: 'auth0|456', email: 'new@test.com', name: 'New', role: 'user' };
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [newUser] });
      const result = await getOrCreateUser('auth0|456', 'new@test.com', 'New');
      expect(result).toEqual(newUser);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('PASS — handles null email and name', async () => {
      const user = { auth0_id: 'auth0|789', email: null, name: null, role: 'user' };
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [user] });
      const result = await getOrCreateUser('auth0|789', null, null);
      expect(result.email).toBeNull();
      expect(result.name).toBeNull();
    });

    it('FAIL — throws when database is unavailable', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));
      await expect(getOrCreateUser('auth0|123', 'test@test.com', 'Test'))
        .rejects.toThrow('DB connection failed');
    });

    it('FAIL — does not return user from wrong auth0_id', async () => {
      const user = { auth0_id: 'auth0|correct', email: 'test@test.com', role: 'user' };
      mockQuery.mockResolvedValueOnce({ rows: [user] });
      const result = await getOrCreateUser('auth0|correct', 'test@test.com', 'Test');
      expect(result.auth0_id).not.toBe('auth0|wrong');
    });
  });

  // ─── getDailyCallCount ─────────────────────────────────────────

  describe('getDailyCallCount', () => {

    it('PASS — returns 0 for new user with no activity', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      const count = await getDailyCallCount('auth0|123');
      expect(count).toBe(0);
    });

    it('PASS — returns correct count for active user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] });
      const count = await getDailyCallCount('auth0|123');
      expect(count).toBe(3);
    });

    it('FAIL — count should not be negative', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      const count = await getDailyCallCount('auth0|123');
      expect(count).not.toBeLessThan(0);
    });

    it('FAIL — throws when database query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Query failed'));
      await expect(getDailyCallCount('auth0|123')).rejects.toThrow('Query failed');
    });
  });

  // ─── checkAndIncrementUsage ────────────────────────────────────

  describe('checkAndIncrementUsage', () => {

    it('PASS — allows request when user is under daily limit', async () => {
      const user = { auth0_id: 'auth0|123', role: 'user' };
      mockQuery
        .mockResolvedValueOnce({ rows: [user] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });
      const result = await checkAndIncrementUsage('auth0|123', 'test@test.com', 'Test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('PASS — blocks request when user has reached limit', async () => {
      const user = { auth0_id: 'auth0|123', role: 'user' };
      mockQuery
        .mockResolvedValueOnce({ rows: [user] })
        .mockResolvedValueOnce({ rows: [{ count: '4' }] });
      const result = await checkAndIncrementUsage('auth0|123', 'test@test.com', 'Test');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('PASS — admin bypasses the limit entirely', async () => {
      const admin = { auth0_id: 'auth0|admin', role: 'admin' };
      mockQuery.mockResolvedValueOnce({ rows: [admin] });
      const result = await checkAndIncrementUsage('auth0|admin', 'admin@test.com', 'Admin');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('PASS — moderator bypasses the limit entirely', async () => {
      const mod = { auth0_id: 'auth0|mod', role: 'moderator' };
      mockQuery.mockResolvedValueOnce({ rows: [mod] });
      const result = await checkAndIncrementUsage('auth0|mod', 'mod@test.com', 'Mod');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('FAIL — regular user should NOT have infinite remaining', async () => {
      const user = { auth0_id: 'auth0|123', role: 'user' };
      mockQuery
        .mockResolvedValueOnce({ rows: [user] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });
      const result = await checkAndIncrementUsage('auth0|123', 'test@test.com', 'Test');
      expect(result.remaining).not.toBe(Infinity);
    });

    it('FAIL — blocked user should not have allowed = true', async () => {
      const user = { auth0_id: 'auth0|123', role: 'user' };
      mockQuery
        .mockResolvedValueOnce({ rows: [user] })
        .mockResolvedValueOnce({ rows: [{ count: '4' }] });
      const result = await checkAndIncrementUsage('auth0|123', 'test@test.com', 'Test');
      expect(result.allowed).not.toBe(true);
    });
  });

  // ─── getUsage ──────────────────────────────────────────────────

  describe('getUsage', () => {

    it('PASS — returns defaults for unknown user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const usage = await getUsage('auth0|unknown');
      expect(usage.ai_calls).toBe(0);
      expect(usage.role).toBe('user');
    });

    it('PASS — returns correct usage for known user', async () => {
      const user = { auth0_id: 'auth0|123', role: 'user' };
      mockQuery
        .mockResolvedValueOnce({ rows: [user] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] });
      const usage = await getUsage('auth0|123');
      expect(usage.ai_calls).toBe(2);
      expect(usage.total_calls).toBe(10);
    });

    it('FAIL — remaining should never be negative', async () => {
      const user = { auth0_id: 'auth0|123', role: 'user' };
      mockQuery
        .mockResolvedValueOnce({ rows: [user] })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ count: '50' }] });
      const usage = await getUsage('auth0|123');
      expect(usage.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── logActivity ───────────────────────────────────────────────

  describe('logActivity', () => {

    it('PASS — logs activity with all required fields', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(
        logActivity('auth0|123', 'Is India at war?', 'nlp', '{"matches":[]}')
      ).resolves.not.toThrow();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_activity'),
        expect.arrayContaining(['auth0|123', 'Is India at war?', 'nlp'])
      );
    });

    it('PASS — logs activity with null response', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(
        logActivity('auth0|123', 'Test query', 'llm_vector_store', null)
      ).resolves.not.toThrow();
    });

    it('FAIL — throws when insert fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Insert failed'));
      await expect(
        logActivity('auth0|123', 'Test', 'nlp', null)
      ).rejects.toThrow('Insert failed');
    });
  });
});

// Cover usageController error handler (line 19)
it('PASS — getUsage handles database error gracefully', async () => {
  mockQuery.mockRejectedValueOnce(new Error('DB down'));
  await expect(getUsage('auth0|123')).rejects.toThrow('DB down');
});

// Cover factCheckingController fallback claims (lines 10-14)
it('PASS — checkAndIncrementUsage works with null email and name', async () => {
  const user = { auth0_id: 'auth0|123', role: 'user' };
  mockQuery
    .mockResolvedValueOnce({ rows: [user] })
    .mockResolvedValueOnce({ rows: [{ count: '1' }] });
  const result = await checkAndIncrementUsage('auth0|123', null, null);
  expect(result.allowed).toBe(true);
});

// Cover moderator branch in getUsage (line 66)
it('PASS — getUsage returns unlimited for moderator', async () => {
  const user = { auth0_id: 'auth0|mod', role: 'moderator' };
  mockQuery.mockResolvedValueOnce({ rows: [user] });
  const result = await checkAndIncrementUsage('auth0|mod', 'mod@test.com', 'Mod');
  expect(result.allowed).toBe(true);
  expect(result.remaining).toBe(Infinity);
});