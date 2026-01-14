/**
 * API Key Generation and Validation
 *
 * API keys follow the format: chpr_<32-char-random>
 * Keys are stored as SHA-256 hashes, never in plain text
 */

import { createHash, randomBytes } from 'crypto';

// API key prefix for identification
const API_KEY_PREFIX = 'chpr_';
const KEY_LENGTH = 32; // characters after prefix

export interface ApiKeyPermission {
  permission: 'READ_PORTFOLIO' | 'READ_QUOTES' | 'WRITE_TRADES' | 'WRITE_SETTINGS';
  description: string;
}

export const API_PERMISSIONS: Record<string, ApiKeyPermission> = {
  READ_PORTFOLIO: {
    permission: 'READ_PORTFOLIO',
    description: 'Read portfolio balances and positions',
  },
  READ_QUOTES: {
    permission: 'READ_QUOTES',
    description: 'Get swap quotes and price data',
  },
  WRITE_TRADES: {
    permission: 'WRITE_TRADES',
    description: 'Execute trades and swaps',
  },
  WRITE_SETTINGS: {
    permission: 'WRITE_SETTINGS',
    description: 'Modify user settings and preferences',
  },
};

export interface GeneratedApiKey {
  key: string; // The full API key (show to user once)
  keyPrefix: string; // First 8 chars for identification
  keyHash: string; // SHA-256 hash for storage
}

export interface ApiKeyValidation {
  valid: boolean;
  keyHash?: string;
  keyPrefix?: string;
  error?: string;
}

/**
 * Generate a new API key
 *
 * @returns Object containing the key, prefix, and hash
 */
export function generateApiKey(): GeneratedApiKey {
  // Generate random bytes and convert to base64url
  const randomPart = randomBytes(KEY_LENGTH)
    .toString('base64url')
    .slice(0, KEY_LENGTH);

  const key = `${API_KEY_PREFIX}${randomPart}`;
  const keyPrefix = key.slice(0, 12); // "chpr_" + first 7 chars
  const keyHash = hashApiKey(key);

  return {
    key,
    keyPrefix,
    keyHash,
  };
}

/**
 * Hash an API key using SHA-256
 *
 * @param key - The plain API key
 * @returns SHA-256 hash of the key
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format
 *
 * @param key - The API key to validate
 * @returns Validation result with hash if valid
 */
export function validateApiKeyFormat(key: string): ApiKeyValidation {
  // Check if key is provided
  if (!key || typeof key !== 'string') {
    return {
      valid: false,
      error: 'API key is required',
    };
  }

  // Check prefix
  if (!key.startsWith(API_KEY_PREFIX)) {
    return {
      valid: false,
      error: 'Invalid API key format',
    };
  }

  // Check length
  const expectedLength = API_KEY_PREFIX.length + KEY_LENGTH;
  if (key.length !== expectedLength) {
    return {
      valid: false,
      error: 'Invalid API key length',
    };
  }

  // Check characters (base64url safe)
  const keyPart = key.slice(API_KEY_PREFIX.length);
  if (!/^[A-Za-z0-9_-]+$/.test(keyPart)) {
    return {
      valid: false,
      error: 'Invalid API key characters',
    };
  }

  return {
    valid: true,
    keyHash: hashApiKey(key),
    keyPrefix: key.slice(0, 12),
  };
}

/**
 * Compare a provided key with a stored hash
 *
 * @param providedKey - The API key provided in the request
 * @param storedHash - The hash stored in the database
 * @returns True if the key matches the hash
 */
export function verifyApiKey(providedKey: string, storedHash: string): boolean {
  const validation = validateApiKeyFormat(providedKey);
  if (!validation.valid) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  const providedHash = validation.keyHash!;
  if (providedHash.length !== storedHash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < providedHash.length; i++) {
    result |= providedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Extract API key from Authorization header
 *
 * Supports formats:
 * - Bearer chpr_xxx
 * - ApiKey chpr_xxx
 * - chpr_xxx (raw key)
 *
 * @param authHeader - The Authorization header value
 * @returns The extracted API key or null
 */
export function extractApiKeyFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Try "Bearer <key>" format
  if (authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7).trim();
    if (key.startsWith(API_KEY_PREFIX)) {
      return key;
    }
  }

  // Try "ApiKey <key>" format
  if (authHeader.startsWith('ApiKey ')) {
    return authHeader.slice(7).trim();
  }

  // Try raw key format
  if (authHeader.startsWith(API_KEY_PREFIX)) {
    return authHeader.trim();
  }

  return null;
}

/**
 * Check if a set of permissions includes a required permission
 *
 * @param userPermissions - The permissions the user has
 * @param requiredPermission - The permission required for the action
 * @returns True if the user has the required permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has all required permissions
 *
 * @param userPermissions - The permissions the user has
 * @param requiredPermissions - All permissions required
 * @returns True if user has all required permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has any of the required permissions
 *
 * @param userPermissions - The permissions the user has
 * @param requiredPermissions - Any of these permissions
 * @returns True if user has at least one required permission
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Get default permissions for a new API key
 */
export function getDefaultPermissions(): string[] {
  return ['READ_PORTFOLIO', 'READ_QUOTES'];
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): string[] {
  return Object.keys(API_PERMISSIONS);
}
