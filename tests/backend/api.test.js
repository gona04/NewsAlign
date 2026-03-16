import { jest } from '@jest/globals';

// Mock ALL heavy modules BEFORE importing app
jest.unstable_mockModule('../../backend/db/client.js', () => ({
  default: { query: jest.fn() },
}));

jest.unstable_mockModule('../../backend/middleware/auth.js', () => ({
  checkJwt: (req, res, next) => {
    req.auth = {
      payload: {
        sub: 'auth0|testuser',
        email: 'test@test.com',
        name: 'Test User',
        'https://fact-checker/email': 'test@test.com',
        'https://fact-checker/name': 'Test User',
        'https://fact-checker/roles': [],
      },
    };
    next();
  },
}));

jest.unstable_mockModule('../../backend/services/usageService.js', () => ({
  getOrCreateUser: jest.fn().mockResolvedValue({
    auth0_id: 'auth0|testuser',
    role: 'user',
  }),
  checkAndIncrementUsage: jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 3,
  }),
  logActivity: jest.fn().mockResolvedValue(undefined),
  getUsage: jest.fn().mockResolvedValue({
    ai_calls: 1,
    remaining: 3,
    role: 'user',
    total_calls: 5,
  }),
  getDailyCallCount: jest.fn().mockResolvedValue(1),
  getTotalCallCount: jest.fn().mockResolvedValue(5),
}));

jest.unstable_mockModule('../../backend/services/factCheckerAI.js', () => ({
  factCheck: jest.fn().mockResolvedValue({
    verdict: 'UNCERTAIN — not enough evidence.',
    sources: [{ headline: 'Test headline' }],
  }),
}));

jest.unstable_mockModule('../../backend/services/vectorStore.js', () => ({
  buildIndex: jest.fn().mockResolvedValue(undefined),
  searchIndex: jest.fn().mockResolvedValue([{ headline: 'Test headline' }]),
}));

jest.unstable_mockModule('../../backend/services/classifyService.js', () => ({
  classifyUserStatementService: jest.fn().mockResolvedValue({
    matches: ['Test headline'],
    result: 'Classification: True',
  }),
}));

jest.unstable_mockModule('../../tensor-flow-model/userInput/handelingUserInput.js', () => ({
  scrapeAndSaveHeadlines: jest.fn().mockResolvedValue(undefined),
  loadUnNeutralizedHeadlines: jest.fn().mockReturnValue(['Headline 1', 'Headline 2']),
  cleaningingInput: jest.fn().mockReturnValue('cleaned input'),
}));

// Import AFTER all mocks are set up
const { default: request } = await import('supertest');
const { default: app } = await import('../../backend/application-api.js');

describe('API Routes', () => {

  // ─── Public Routes ─────────────────────────────────────────────

  describe('GET /api/news', () => {
    it('PASS — returns 200 without auth token', async () => {
      const res = await request(app).get('/api/news');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
    });

    it('PASS — response data is an array', async () => {
      const res = await request(app).get('/api/news');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('FAIL — should not return error field on success', async () => {
      const res = await request(app).get('/api/news');
      expect(res.body).not.toHaveProperty('error');
    });
  });

  // ─── Usage Route ───────────────────────────────────────────────

  describe('GET /api/usage', () => {
    it('PASS — returns usage stats for authenticated user', async () => {
      const res = await request(app)
        .get('/api/usage')
        .set('Authorization', 'Bearer test-token');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ai_calls');
      expect(res.body).toHaveProperty('remaining');
      expect(res.body).toHaveProperty('role');
    });

    it('PASS — remaining is a non-negative number', async () => {
      const res = await request(app)
        .get('/api/usage')
        .set('Authorization', 'Bearer test-token');
      expect(res.body.remaining).toBeGreaterThanOrEqual(0);
    });

    it('FAIL — role should not be undefined', async () => {
      const res = await request(app)
        .get('/api/usage')
        .set('Authorization', 'Bearer test-token');
      expect(res.body.role).toBeDefined();
    });
  });

  // ─── Classify Route ────────────────────────────────────────────

  describe('POST /api/classify', () => {
    it('PASS — returns classification result for valid input', async () => {
      const res = await request(app)
        .post('/api/classify')
        .set('Authorization', 'Bearer test-token')
        .send({ userInput: 'Is India at war?' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('matches');
      expect(res.body).toHaveProperty('result');
    });

    it('PASS — matches is an array', async () => {
      const res = await request(app)
        .post('/api/classify')
        .set('Authorization', 'Bearer test-token')
        .send({ userInput: 'Is India at war?' });
      expect(Array.isArray(res.body.matches)).toBe(true);
    });

    it('FAIL — returns 400 when userInput is missing', async () => {
      const res = await request(app)
        .post('/api/classify')
        .set('Authorization', 'Bearer test-token')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('userInput is required');
    });

    it('FAIL — returns 400 when userInput is empty string', async () => {
      const res = await request(app)
        .post('/api/classify')
        .set('Authorization', 'Bearer test-token')
        .send({ userInput: '' });
      expect(res.status).toBe(400);
    });
  });

  // ─── Vector Classify Route ─────────────────────────────────────

  describe('POST /api/vector-classify', () => {
    it('PASS — returns result for valid input', async () => {
      const res = await request(app)
        .post('/api/vector-classify')
        .set('Authorization', 'Bearer test-token')
        .send({ userInput: 'Is India at war?' });
      expect([200, 503]).toContain(res.status);
    });

    it('FAIL — returns 400 when userInput is missing', async () => {
      const res = await request(app)
        .post('/api/vector-classify')
        .set('Authorization', 'Bearer test-token')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('userInput is required');
    });
  });

  // ─── Fact Check Route ──────────────────────────────────────────

  describe('POST /fact-checking/fact-check', () => {
    it('PASS — returns verdict for valid input', async () => {
      const res = await request(app)
        .post('/fact-checking/fact-check')
        .set('Authorization', 'Bearer test-token')
        .send({ userInput: 'Is India at war?' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('verdict');
      expect(res.body).toHaveProperty('sources');
    });

    it('PASS — verdict is a non-empty string', async () => {
      const res = await request(app)
        .post('/fact-checking/fact-check')
        .set('Authorization', 'Bearer test-token')
        .send({ userInput: 'Is India at war?' });
      expect(typeof res.body.verdict).toBe('string');
      expect(res.body.verdict.length).toBeGreaterThan(0);
    });

    it('FAIL — returns 429 when daily limit is reached', async () => {
      const { checkAndIncrementUsage } = await import('../../backend/services/usageService.js');
      checkAndIncrementUsage.mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetsAt: new Date(),
      });
      const res = await request(app)
        .post('/fact-checking/fact-check')
        .set('Authorization', 'Bearer test-token')
        .send({ userInput: 'Is India at war?' });
      expect(res.status).toBe(429);
      expect(res.body.error).toContain('daily AI fact-checks');
    });

    it('FAIL — returns 500 when OpenAI call fails', async () => {
      const { factCheck } = await import('../../backend/services/factCheckerAI.js');
      factCheck.mockRejectedValueOnce(new Error('OpenAI API error'));
      const res = await request(app)
        .post('/fact-checking/fact-check')
        .set('Authorization', 'Bearer test-token')
        .send({ userInput: 'Is India at war?' });
      expect(res.status).toBe(500);
    });
  });

  // ─── Teardown ──────────────────────────────────────────────────

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });
});