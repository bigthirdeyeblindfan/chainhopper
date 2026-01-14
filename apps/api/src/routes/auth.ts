import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../app.js';

// ============================================================================
// Schemas
// ============================================================================

const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

const TokenResponseSchema = z.object({
  accessToken: z.string().openapi({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'JWT access token (expires in 1 hour)'
  }),
  refreshToken: z.string().openapi({
    example: 'chrf_abc123...',
    description: 'Refresh token (expires in 30 days)'
  }),
  expiresIn: z.number().openapi({ example: 3600, description: 'Access token TTL in seconds' }),
  tokenType: z.literal('Bearer'),
});

const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string().openapi({ example: 'Trading Bot Key' }),
  key: z.string().optional().openapi({
    example: 'chpr_abc123...',
    description: 'Only returned on creation'
  }),
  keyPrefix: z.string().openapi({ example: 'chpr_abc1' }),
  permissions: z.array(z.enum(['read', 'trade', 'withdraw'])),
  rateLimit: z.number().openapi({ example: 60, description: 'Requests per minute' }),
  lastUsed: z.string().optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
});

const TelegramAuthDataSchema = z.object({
  id: z.number().openapi({ example: 123456789 }),
  first_name: z.string().openapi({ example: 'John' }),
  last_name: z.string().optional(),
  username: z.string().optional().openapi({ example: 'johndoe' }),
  photo_url: z.string().optional(),
  auth_date: z.number().openapi({ description: 'Unix timestamp of auth' }),
  hash: z.string().openapi({ description: 'Telegram verification hash' }),
});

// ============================================================================
// Routes
// ============================================================================

const telegramAuthRoute = createRoute({
  method: 'post',
  path: '/auth/telegram',
  tags: ['Authentication'],
  summary: 'Authenticate via Telegram',
  description: 'Authenticate using Telegram Login Widget data. Creates account if new user.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: TelegramAuthDataSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TokenResponseSchema.extend({
            isNewUser: z.boolean().openapi({ description: 'True if this is a new registration' }),
          }),
        },
      },
      description: 'Authentication successful',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid auth data',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Auth verification failed',
    },
  },
});

const refreshTokenRoute = createRoute({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Authentication'],
  summary: 'Refresh access token',
  description: 'Get a new access token using a refresh token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: TokenResponseSchema } },
      description: 'Token refreshed successfully',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid or expired refresh token',
    },
  },
});

const logoutRoute = createRoute({
  method: 'post',
  path: '/auth/logout',
  tags: ['Authentication'],
  summary: 'Logout',
  description: 'Invalidate the current session and refresh token',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string().optional().openapi({
              description: 'If provided, also invalidates this refresh token'
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: 'Logged out successfully',
    },
  },
});

const listApiKeysRoute = createRoute({
  method: 'get',
  path: '/auth/api-keys',
  tags: ['Authentication'],
  summary: 'List API keys',
  description: 'Get all API keys for the authenticated user',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            apiKeys: z.array(ApiKeySchema),
          }),
        },
      },
      description: 'List of API keys',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const createApiKeyRoute = createRoute({
  method: 'post',
  path: '/auth/api-keys',
  tags: ['Authentication'],
  summary: 'Create API key',
  description: 'Create a new API key. The full key is only returned once on creation.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(50).openapi({ example: 'My Trading Bot' }),
            permissions: z.array(z.enum(['read', 'trade', 'withdraw'])).openapi({
              example: ['read', 'trade'],
              description: 'Permissions for this key'
            }),
            expiresAt: z.string().optional().openapi({
              example: '2025-12-31T23:59:59Z',
              description: 'Optional expiration date'
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: ApiKeySchema } },
      description: 'API key created. Save the key value - it cannot be retrieved later.',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid parameters',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Maximum API keys limit reached (10)',
    },
  },
});

const deleteApiKeyRoute = createRoute({
  method: 'delete',
  path: '/auth/api-keys/{keyId}',
  tags: ['Authentication'],
  summary: 'Delete API key',
  description: 'Revoke an API key',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      keyId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: 'API key deleted',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'API key not found',
    },
  },
});

const verifyRoute = createRoute({
  method: 'get',
  path: '/auth/verify',
  tags: ['Authentication'],
  summary: 'Verify token',
  description: 'Verify the current access token is valid',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            valid: z.boolean(),
            userId: z.string(),
            type: z.enum(['jwt', 'apiKey']),
            permissions: z.array(z.string()).optional(),
            expiresAt: z.string().optional(),
          }),
        },
      },
      description: 'Token is valid',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid or expired token',
    },
  },
});

// ============================================================================
// Router
// ============================================================================

export const authRoutes = new OpenAPIHono<AppEnv>()
  .openapi(telegramAuthRoute, async (c) => {
    const authData = c.req.valid('json');

    // TODO: Verify Telegram hash using bot token
    // const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    // const dataCheckString = Object.entries(authData)
    //   .filter(([k]) => k !== 'hash')
    //   .sort()
    //   .map(([k, v]) => `${k}=${v}`)
    //   .join('\n');
    // const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    // if (hmac !== authData.hash) return c.json({ error: 'Invalid hash', code: 'INVALID_HASH' }, 401);

    // TODO: Create or get user from database
    const isNewUser = false;
    const userId = `user_${authData.id}`;

    // TODO: Generate actual JWT tokens
    const accessToken = `mock_jwt_${userId}_${Date.now()}`;
    const refreshToken = `chrf_${crypto.randomUUID()}`;

    return c.json({
      accessToken,
      refreshToken,
      expiresIn: 3600,
      tokenType: 'Bearer' as const,
      isNewUser,
    }, 200);
  })
  .openapi(refreshTokenRoute, async (c) => {
    const { refreshToken } = c.req.valid('json');

    // TODO: Validate refresh token and generate new tokens
    if (!refreshToken.startsWith('chrf_')) {
      return c.json({ error: 'Invalid refresh token', code: 'INVALID_TOKEN' }, 401);
    }

    const newAccessToken = `mock_jwt_refreshed_${Date.now()}`;
    const newRefreshToken = `chrf_${crypto.randomUUID()}`;

    return c.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600,
      tokenType: 'Bearer' as const,
    }, 200);
  })
  .openapi(logoutRoute, async (c) => {
    const { refreshToken } = c.req.valid('json');

    // TODO: Invalidate session and optionally refresh token
    return c.json({
      success: true,
      message: 'Logged out successfully',
    }, 200);
  })
  .openapi(listApiKeysRoute, async (c) => {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch from database
    const apiKeys = [
      {
        id: 'key_1',
        name: 'Trading Bot',
        keyPrefix: 'chpr_abc1',
        permissions: ['read' as const, 'trade' as const],
        rateLimit: 60,
        lastUsed: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    ];

    return c.json({ apiKeys }, 200);
  })
  .openapi(createApiKeyRoute, async (c) => {
    const { name, permissions, expiresAt } = c.req.valid('json');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Check API key limit and create in database
    const keyId = `key_${crypto.randomUUID().slice(0, 8)}`;
    const fullKey = `chpr_${crypto.randomUUID().replace(/-/g, '')}`;
    const keyPrefix = fullKey.slice(0, 12);

    return c.json({
      id: keyId,
      name,
      key: fullKey, // Only returned on creation!
      keyPrefix,
      permissions,
      rateLimit: 60,
      expiresAt,
      createdAt: new Date().toISOString(),
    }, 201);
  })
  .openapi(deleteApiKeyRoute, async (c) => {
    const { keyId } = c.req.valid('param');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Delete from database
    return c.json({
      success: true,
      message: `API key ${keyId} has been revoked`,
    }, 200);
  })
  .openapi(verifyRoute, async (c) => {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Invalid token', code: 'INVALID_TOKEN' }, 401);
    }

    return c.json({
      valid: true,
      userId,
      type: 'jwt' as const,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    }, 200);
  });
