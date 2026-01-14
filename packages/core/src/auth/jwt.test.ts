import { describe, it, expect, beforeEach } from 'vitest';
import {
  initJWT,
  generateTokens,
  generateAccessToken,
  verifyToken,
  refreshTokens,
  decodeTokenUnsafe,
} from './jwt.js';

describe('JWT Authentication', () => {
  const testSecret = 'test-secret-key-for-unit-tests-minimum-32-chars';
  const testUserId = 'user_123';
  const testTier = 'premium';

  beforeEach(() => {
    initJWT({
      secret: testSecret,
      issuer: 'test-issuer',
      audience: 'test-audience',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const tokens = await generateTokens(testUserId, testTier);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(900); // 15 minutes in seconds
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should generate valid JWT format tokens', async () => {
      const tokens = await generateTokens(testUserId, testTier);

      // JWT format: header.payload.signature
      const parts = tokens.accessToken.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid access token', async () => {
      const tokens = await generateTokens(testUserId, testTier);
      const result = await verifyToken(tokens.accessToken);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.sub).toBe(testUserId);
        expect(result.payload.tier).toBe(testTier);
        expect(result.payload.type).toBe('access');
        expect(result.payload.iss).toBe('test-issuer');
        expect(result.payload.aud).toBe('test-audience');
      }
    });

    it('should verify a valid refresh token', async () => {
      const tokens = await generateTokens(testUserId, testTier);
      const result = await verifyToken(tokens.refreshToken);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.type).toBe('refresh');
      }
    });

    it('should reject malformed tokens', async () => {
      const result = await verifyToken('not-a-valid-token');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('malformed');
      }
    });

    it('should reject tokens with wrong issuer', async () => {
      const tokens = await generateTokens(testUserId, testTier);

      // Reinitialize with different issuer
      initJWT({
        secret: testSecret,
        issuer: 'different-issuer',
        audience: 'test-audience',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
      });

      const result = await verifyToken(tokens.accessToken);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('invalid');
      }
    });

    it('should reject tokens with wrong secret', async () => {
      const tokens = await generateTokens(testUserId, testTier);

      // Reinitialize with different secret
      initJWT({
        secret: 'different-secret-key-minimum-32-chars',
        issuer: 'test-issuer',
        audience: 'test-audience',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
      });

      const result = await verifyToken(tokens.accessToken);

      expect(result.valid).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate only an access token', async () => {
      const { token, expiresIn } = await generateAccessToken(testUserId, testTier);

      expect(token).toBeDefined();
      expect(expiresIn).toBe(900);

      const result = await verifyToken(token);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.type).toBe('access');
      }
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens from valid refresh token', async () => {
      const originalTokens = await generateTokens(testUserId, testTier);

      // Small delay to ensure different iat timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));

      const newTokens = await refreshTokens(originalTokens.refreshToken);

      expect(newTokens).not.toBeNull();
      expect(newTokens?.accessToken).toBeDefined();
      expect(newTokens?.refreshToken).toBeDefined();
      expect(newTokens?.accessToken).not.toBe(originalTokens.accessToken);
    });

    it('should reject access token for refresh', async () => {
      const tokens = await generateTokens(testUserId, testTier);
      const result = await refreshTokens(tokens.accessToken);

      expect(result).toBeNull();
    });

    it('should reject invalid refresh token', async () => {
      const result = await refreshTokens('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('decodeTokenUnsafe', () => {
    it('should decode token without verification', async () => {
      const tokens = await generateTokens(testUserId, testTier);
      const decoded = decodeTokenUnsafe(tokens.accessToken);

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(testUserId);
      expect(decoded?.tier).toBe(testTier);
      expect(decoded?.type).toBe('access');
    });

    it('should return null for invalid token', () => {
      const decoded = decodeTokenUnsafe('not-a-token');

      expect(decoded).toBeNull();
    });
  });

  describe('expiry parsing', () => {
    it('should parse minutes correctly', async () => {
      initJWT({
        secret: testSecret,
        issuer: 'test-issuer',
        audience: 'test-audience',
        accessTokenExpiry: '30m',
        refreshTokenExpiry: '7d',
      });

      const tokens = await generateTokens(testUserId, testTier);
      expect(tokens.expiresIn).toBe(1800); // 30 * 60
    });

    it('should parse hours correctly', async () => {
      initJWT({
        secret: testSecret,
        issuer: 'test-issuer',
        audience: 'test-audience',
        accessTokenExpiry: '2h',
        refreshTokenExpiry: '7d',
      });

      const tokens = await generateTokens(testUserId, testTier);
      expect(tokens.expiresIn).toBe(7200); // 2 * 60 * 60
    });

    it('should parse days correctly', async () => {
      initJWT({
        secret: testSecret,
        issuer: 'test-issuer',
        audience: 'test-audience',
        accessTokenExpiry: '1d',
        refreshTokenExpiry: '7d',
      });

      const tokens = await generateTokens(testUserId, testTier);
      expect(tokens.expiresIn).toBe(86400); // 24 * 60 * 60
    });
  });
});
