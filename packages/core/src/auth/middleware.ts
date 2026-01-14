// @ts-nocheck
/**
 * Authentication Middleware for Hono
 *
 * Provides middleware functions for protecting API routes with:
 * - JWT authentication (for web/mobile clients)
 * - API key authentication (for programmatic access)
 * - Telegram Web App authentication (for Mini App)
 */

import type { Context, MiddlewareHandler, Next } from 'hono';
import { verifyToken, type DecodedToken } from './jwt.js';
import {
  extractApiKeyFromHeader,
  validateApiKeyFormat,
  hasPermission,
  hasAllPermissions,
} from './apiKey.js';
import { verifyTelegramWebAppData, type TelegramUser } from './telegram.js';

// Extend Hono context with auth data
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userTier: string;
    authType: 'jwt' | 'apiKey' | 'telegram';
    apiKeyId?: string;
    apiKeyPermissions?: string[];
    telegramUser?: TelegramUser;
    jwtPayload?: DecodedToken;
  }
}

// Auth error response
interface AuthError {
  error: string;
  code: string;
  status: number;
}

// Lookup functions (to be provided by the application)
export interface AuthLookupFunctions {
  findUserById: (id: string) => Promise<{ id: string; tier: string } | null>;
  findApiKeyByHash: (hash: string) => Promise<{
    id: string;
    userId: string;
    permissions: string[];
    rateLimit: number;
    isActive: boolean;
    expiresAt: Date | null;
  } | null>;
  findUserByTelegramId: (telegramId: string) => Promise<{ id: string; tier: string } | null>;
  createUserFromTelegram?: (user: TelegramUser) => Promise<{ id: string; tier: string }>;
  updateApiKeyLastUsed?: (keyId: string) => Promise<void>;
}

let lookupFunctions: AuthLookupFunctions | null = null;

/**
 * Initialize auth middleware with lookup functions
 */
export function initAuthMiddleware(functions: AuthLookupFunctions): void {
  lookupFunctions = functions;
}

/**
 * Create an auth error response
 */
function authError(c: Context, error: AuthError): Response {
  return c.json(
    {
      error: error.error,
      code: error.code,
    },
    error.status as 401 | 403
  );
}

/**
 * JWT Authentication Middleware
 *
 * Validates Bearer token and sets user context
 */
export function jwtAuth(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return authError(c, {
        error: 'Missing or invalid Authorization header',
        code: 'MISSING_AUTH',
        status: 401,
      });
    }

    const token = authHeader.slice(7);
    const result = await verifyToken(token);

    if (!result.valid) {
      return authError(c, {
        error: result.message,
        code: result.error === 'expired' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        status: 401,
      });
    }

    // Check token type
    if (result.payload.type !== 'access') {
      return authError(c, {
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE',
        status: 401,
      });
    }

    // Set context variables
    c.set('userId', result.payload.sub);
    c.set('userTier', result.payload.tier);
    c.set('authType', 'jwt');
    c.set('jwtPayload', result.payload);

    await next();
  };
}

/**
 * API Key Authentication Middleware
 *
 * Validates API key and checks permissions
 */
export function apiKeyAuth(requiredPermissions?: string[]): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    if (!lookupFunctions) {
      throw new Error('Auth middleware not initialized. Call initAuthMiddleware first.');
    }

    const authHeader = c.req.header('Authorization');
    const apiKey = extractApiKeyFromHeader(authHeader);

    if (!apiKey) {
      return authError(c, {
        error: 'Missing or invalid API key',
        code: 'MISSING_API_KEY',
        status: 401,
      });
    }

    const validation = validateApiKeyFormat(apiKey);
    if (!validation.valid) {
      return authError(c, {
        error: validation.error!,
        code: 'INVALID_API_KEY',
        status: 401,
      });
    }

    // Look up the API key
    const keyData = await lookupFunctions.findApiKeyByHash(validation.keyHash!);

    if (!keyData) {
      return authError(c, {
        error: 'API key not found',
        code: 'API_KEY_NOT_FOUND',
        status: 401,
      });
    }

    if (!keyData.isActive) {
      return authError(c, {
        error: 'API key is disabled',
        code: 'API_KEY_DISABLED',
        status: 401,
      });
    }

    if (keyData.expiresAt && keyData.expiresAt < new Date()) {
      return authError(c, {
        error: 'API key has expired',
        code: 'API_KEY_EXPIRED',
        status: 401,
      });
    }

    // Check required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasAllPermissions(keyData.permissions, requiredPermissions)) {
        return authError(c, {
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          status: 403,
        });
      }
    }

    // Get user data
    const user = await lookupFunctions.findUserById(keyData.userId);
    if (!user) {
      return authError(c, {
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        status: 401,
      });
    }

    // Update last used timestamp (fire and forget)
    if (lookupFunctions.updateApiKeyLastUsed) {
      lookupFunctions.updateApiKeyLastUsed(keyData.id).catch(() => {});
    }

    // Set context variables
    c.set('userId', user.id);
    c.set('userTier', user.tier);
    c.set('authType', 'apiKey');
    c.set('apiKeyId', keyData.id);
    c.set('apiKeyPermissions', keyData.permissions);

    await next();
  };
}

/**
 * Telegram Web App Authentication Middleware
 *
 * Validates Telegram initData and creates/finds user
 */
export function telegramAuth(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    if (!lookupFunctions) {
      throw new Error('Auth middleware not initialized. Call initAuthMiddleware first.');
    }

    // Get initData from header or body
    const initData =
      c.req.header('X-Telegram-Init-Data') ||
      (await c.req.json().catch(() => ({}))).initData;

    if (!initData) {
      return authError(c, {
        error: 'Missing Telegram init data',
        code: 'MISSING_TELEGRAM_DATA',
        status: 401,
      });
    }

    const result = verifyTelegramWebAppData(initData);

    if (!result.valid) {
      return authError(c, {
        error: result.error!,
        code: 'INVALID_TELEGRAM_DATA',
        status: 401,
      });
    }

    if (!result.user) {
      return authError(c, {
        error: 'No user data in init data',
        code: 'NO_USER_DATA',
        status: 401,
      });
    }

    // Find or create user
    let user = await lookupFunctions.findUserByTelegramId(result.user.id.toString());

    if (!user && lookupFunctions.createUserFromTelegram) {
      user = await lookupFunctions.createUserFromTelegram(result.user);
    }

    if (!user) {
      return authError(c, {
        error: 'User not found and auto-creation disabled',
        code: 'USER_NOT_FOUND',
        status: 401,
      });
    }

    // Set context variables
    c.set('userId', user.id);
    c.set('userTier', user.tier);
    c.set('authType', 'telegram');
    c.set('telegramUser', result.user);

    await next();
  };
}

/**
 * Combined Auth Middleware
 *
 * Tries JWT first, then API key, then Telegram
 * Useful for endpoints that accept multiple auth methods
 */
export function combinedAuth(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    const telegramData = c.req.header('X-Telegram-Init-Data');

    // Try JWT (Bearer token that's not an API key)
    if (authHeader?.startsWith('Bearer ') && !authHeader.includes('chpr_')) {
      return jwtAuth()(c, next);
    }

    // Try API key
    if (authHeader && extractApiKeyFromHeader(authHeader)) {
      return apiKeyAuth()(c, next);
    }

    // Try Telegram
    if (telegramData) {
      return telegramAuth()(c, next);
    }

    return authError(c, {
      error: 'No valid authentication provided',
      code: 'NO_AUTH',
      status: 401,
    });
  };
}

/**
 * Optional Auth Middleware
 *
 * Sets auth context if valid auth is provided, but doesn't require it
 */
export function optionalAuth(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    const telegramData = c.req.header('X-Telegram-Init-Data');

    // Try to authenticate but don't fail if not present
    if (authHeader?.startsWith('Bearer ') && !authHeader.includes('chpr_')) {
      const token = authHeader.slice(7);
      const result = await verifyToken(token);

      if (result.valid && result.payload.type === 'access') {
        c.set('userId', result.payload.sub);
        c.set('userTier', result.payload.tier);
        c.set('authType', 'jwt');
        c.set('jwtPayload', result.payload);
      }
    } else if (authHeader && extractApiKeyFromHeader(authHeader)) {
      // API key auth is more complex, skip for optional
    } else if (telegramData) {
      const result = verifyTelegramWebAppData(telegramData);
      if (result.valid && result.user && lookupFunctions) {
        const user = await lookupFunctions.findUserByTelegramId(result.user.id.toString());
        if (user) {
          c.set('userId', user.id);
          c.set('userTier', user.tier);
          c.set('authType', 'telegram');
          c.set('telegramUser', result.user);
        }
      }
    }

    await next();
  };
}

/**
 * Permission Check Middleware
 *
 * Use after apiKeyAuth to check for specific permissions
 */
export function requirePermission(permission: string): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const permissions = c.get('apiKeyPermissions');

    if (!permissions) {
      // Not using API key auth, allow (use jwtAuth for JWT-only routes)
      await next();
      return;
    }

    if (!hasPermission(permissions, permission)) {
      return authError(c, {
        error: `Missing required permission: ${permission}`,
        code: 'MISSING_PERMISSION',
        status: 403,
      });
    }

    await next();
  };
}

/**
 * Tier Check Middleware
 *
 * Restricts access to users with specific tiers
 */
export function requireTier(allowedTiers: string[]): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const userTier = c.get('userTier');

    if (!userTier) {
      return authError(c, {
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        status: 401,
      });
    }

    if (!allowedTiers.includes(userTier)) {
      return authError(c, {
        error: 'Your account tier does not have access to this feature',
        code: 'TIER_RESTRICTED',
        status: 403,
      });
    }

    await next();
  };
}

/**
 * Rate Limit Check (placeholder - implement with Redis in production)
 */
export function rateLimit(requestsPerMinute: number): MiddlewareHandler {
  // Simple in-memory rate limiting (use Redis in production)
  const requests = new Map<string, { count: number; resetAt: number }>();

  return async (c: Context, next: Next) => {
    const identifier = c.get('userId') || c.req.header('x-forwarded-for') || 'anonymous';
    const now = Date.now();

    let data = requests.get(identifier);

    if (!data || data.resetAt < now) {
      data = { count: 0, resetAt: now + 60000 };
    }

    data.count++;
    requests.set(identifier, data);

    if (data.count > requestsPerMinute) {
      c.header('X-RateLimit-Limit', requestsPerMinute.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', Math.ceil(data.resetAt / 1000).toString());

      return c.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((data.resetAt - now) / 1000),
        },
        429
      );
    }

    c.header('X-RateLimit-Limit', requestsPerMinute.toString());
    c.header('X-RateLimit-Remaining', (requestsPerMinute - data.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(data.resetAt / 1000).toString());

    await next();
  };
}
