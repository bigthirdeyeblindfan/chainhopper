// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock the ws module
vi.mock('../ws/index.js', () => ({
  getWebSocketStats: vi.fn().mockReturnValue({
    totalConnections: 10,
    activeSubscriptions: 25,
    messagesPerSecond: 5.2,
  }),
}));

// Import after mocking
import { healthRoutes } from '../routes/health.js';
import { authRoutes } from '../routes/auth.js';

describe('Health Routes', () => {
  const app = new Hono().route('/', healthRoutes);

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
      expect(body.version).toBe('0.1.0');
      expect(typeof body.uptime).toBe('number');
      expect(Array.isArray(body.chains)).toBe(true);
    });

    it('should include chain status', async () => {
      const res = await app.request('/health');
      const body = await res.json();

      expect(body.chains.length).toBeGreaterThan(0);
      for (const chain of body.chains) {
        expect(chain.chainId).toBeDefined();
        expect(['up', 'down']).toContain(chain.status);
        expect(typeof chain.latency).toBe('number');
      }
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const res = await app.request('/ready');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ready).toBe(true);
    });
  });

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const res = await app.request('/live');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.alive).toBe(true);
    });
  });

  describe('GET /ws/stats', () => {
    it('should return WebSocket stats', async () => {
      const res = await app.request('/ws/stats');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });
  });
});

describe('Auth Routes', () => {
  const app = new Hono().route('/', authRoutes);

  describe('POST /auth/telegram', () => {
    it('should authenticate with valid Telegram data', async () => {
      const res = await app.request('/auth/telegram', {
        method: 'POST',
        body: JSON.stringify({
          id: 123456789,
          first_name: 'Test',
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'testhash',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.expiresIn).toBe(3600);
      expect(body.tokenType).toBe('Bearer');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const res = await app.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'chrf_valid-token',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const res = await app.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'invalid_token',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await app.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBeDefined();
    });
  });

  describe('GET /auth/api-keys', () => {
    it('should require authentication', async () => {
      const res = await app.request('/auth/api-keys');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/verify', () => {
    it('should require authentication', async () => {
      const res = await app.request('/auth/verify');
      expect(res.status).toBe(401);
    });
  });
});

describe('API Route Structure', () => {
  it('should export healthRoutes', () => {
    expect(healthRoutes).toBeDefined();
  });

  it('should export authRoutes', () => {
    expect(authRoutes).toBeDefined();
  });
});
