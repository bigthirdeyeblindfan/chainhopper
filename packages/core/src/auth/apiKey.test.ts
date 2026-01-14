import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  validateApiKeyFormat,
  verifyApiKey,
  extractApiKeyFromHeader,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getDefaultPermissions,
  getAllPermissions,
} from './apiKey.js';

describe('API Key Authentication', () => {
  describe('generateApiKey', () => {
    it('should generate a key with correct prefix', () => {
      const { key } = generateApiKey();

      expect(key).toMatch(/^chpr_/);
    });

    it('should generate key of correct length', () => {
      const { key } = generateApiKey();

      // "chpr_" (5) + 32 chars = 37
      expect(key.length).toBe(37);
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();

      expect(key1.key).not.toBe(key2.key);
      expect(key1.keyHash).not.toBe(key2.keyHash);
    });

    it('should return correct prefix', () => {
      const { key, keyPrefix } = generateApiKey();

      expect(key.startsWith(keyPrefix)).toBe(true);
      expect(keyPrefix.length).toBe(12); // "chpr_" + first 7 chars
    });

    it('should use base64url safe characters', () => {
      const { key } = generateApiKey();
      const keyPart = key.slice(5); // Remove "chpr_"

      expect(keyPart).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('hashApiKey', () => {
    it('should produce consistent hashes', () => {
      const key = 'chpr_test123456789012345678901234';

      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);

      expect(hash1).toBe(hash2);
    });

    it('should produce 64-char hex hash', () => {
      const { key } = generateApiKey();
      const hash = hashApiKey(key);

      expect(hash.length).toBe(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should produce different hashes for different keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();

      expect(key1.keyHash).not.toBe(key2.keyHash);
    });
  });

  describe('validateApiKeyFormat', () => {
    it('should validate correct key format', () => {
      const { key } = generateApiKey();
      const result = validateApiKeyFormat(key);

      expect(result.valid).toBe(true);
      expect(result.keyHash).toBeDefined();
      expect(result.keyPrefix).toBeDefined();
    });

    it('should reject empty key', () => {
      const result = validateApiKeyFormat('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is required');
    });

    it('should reject null/undefined', () => {
      const result = validateApiKeyFormat(null as any);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is required');
    });

    it('should reject wrong prefix', () => {
      const result = validateApiKeyFormat('wrong_prefix12345678901234567890');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key format');
    });

    it('should reject wrong length', () => {
      const result = validateApiKeyFormat('chpr_tooshort');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key length');
    });

    it('should reject invalid characters', () => {
      const result = validateApiKeyFormat('chpr_invalid!@#$%^&*()+=[]{}|;');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key length');
    });
  });

  describe('verifyApiKey', () => {
    it('should verify matching key and hash', () => {
      const { key, keyHash } = generateApiKey();
      const result = verifyApiKey(key, keyHash);

      expect(result).toBe(true);
    });

    it('should reject non-matching key', () => {
      const generated = generateApiKey();
      const otherKey = generateApiKey();

      const result = verifyApiKey(otherKey.key, generated.keyHash);

      expect(result).toBe(false);
    });

    it('should reject invalid key format', () => {
      const { keyHash } = generateApiKey();
      const result = verifyApiKey('invalid', keyHash);

      expect(result).toBe(false);
    });

    it('should reject mismatched hash length', () => {
      const { key } = generateApiKey();
      const result = verifyApiKey(key, 'short-hash');

      expect(result).toBe(false);
    });
  });

  describe('extractApiKeyFromHeader', () => {
    it('should extract from Bearer format', () => {
      const { key } = generateApiKey();
      const result = extractApiKeyFromHeader(`Bearer ${key}`);

      expect(result).toBe(key);
    });

    it('should extract from ApiKey format', () => {
      const { key } = generateApiKey();
      const result = extractApiKeyFromHeader(`ApiKey ${key}`);

      expect(result).toBe(key);
    });

    it('should extract raw key', () => {
      const { key } = generateApiKey();
      const result = extractApiKeyFromHeader(key);

      expect(result).toBe(key);
    });

    it('should return null for empty header', () => {
      expect(extractApiKeyFromHeader('')).toBeNull();
      expect(extractApiKeyFromHeader(null)).toBeNull();
      expect(extractApiKeyFromHeader(undefined)).toBeNull();
    });

    it('should return null for Bearer with JWT', () => {
      const result = extractApiKeyFromHeader('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

      expect(result).toBeNull();
    });

    it('should handle whitespace', () => {
      const { key } = generateApiKey();
      const result = extractApiKeyFromHeader(`Bearer ${key}  `);

      expect(result).toBe(key);
    });
  });

  describe('permission checks', () => {
    const userPermissions = ['READ_PORTFOLIO', 'READ_QUOTES', 'WRITE_TRADES'];

    describe('hasPermission', () => {
      it('should return true for existing permission', () => {
        expect(hasPermission(userPermissions, 'READ_PORTFOLIO')).toBe(true);
      });

      it('should return false for missing permission', () => {
        expect(hasPermission(userPermissions, 'WRITE_SETTINGS')).toBe(false);
      });
    });

    describe('hasAllPermissions', () => {
      it('should return true when all permissions exist', () => {
        expect(hasAllPermissions(userPermissions, ['READ_PORTFOLIO', 'READ_QUOTES'])).toBe(true);
      });

      it('should return false when any permission is missing', () => {
        expect(hasAllPermissions(userPermissions, ['READ_PORTFOLIO', 'WRITE_SETTINGS'])).toBe(false);
      });

      it('should return true for empty required permissions', () => {
        expect(hasAllPermissions(userPermissions, [])).toBe(true);
      });
    });

    describe('hasAnyPermission', () => {
      it('should return true when any permission exists', () => {
        expect(hasAnyPermission(userPermissions, ['WRITE_SETTINGS', 'READ_PORTFOLIO'])).toBe(true);
      });

      it('should return false when no permissions match', () => {
        expect(hasAnyPermission(userPermissions, ['WRITE_SETTINGS', 'ADMIN'])).toBe(false);
      });

      it('should return false for empty required permissions', () => {
        expect(hasAnyPermission(userPermissions, [])).toBe(false);
      });
    });
  });

  describe('default and all permissions', () => {
    it('should return read-only default permissions', () => {
      const defaults = getDefaultPermissions();

      expect(defaults).toContain('READ_PORTFOLIO');
      expect(defaults).toContain('READ_QUOTES');
      expect(defaults).not.toContain('WRITE_TRADES');
      expect(defaults).not.toContain('WRITE_SETTINGS');
    });

    it('should return all available permissions', () => {
      const all = getAllPermissions();

      expect(all).toContain('READ_PORTFOLIO');
      expect(all).toContain('READ_QUOTES');
      expect(all).toContain('WRITE_TRADES');
      expect(all).toContain('WRITE_SETTINGS');
      expect(all.length).toBe(4);
    });
  });
});
