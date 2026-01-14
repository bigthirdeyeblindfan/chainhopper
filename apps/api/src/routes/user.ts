import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../app.js';

// ============================================================================
// Schemas
// ============================================================================

const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

const ChainIdSchema = z.enum([
  'ton', 'ethereum', 'base', 'arbitrum', 'optimism', 'polygon',
  'bsc', 'avalanche', 'sonic', 'kaia', 'berachain', 'sui',
  'eclipse', 'hyperliquid', 'cosmos'
]);

const UserTierSchema = z.enum(['FREE', 'HOLDER', 'STAKER', 'ENTERPRISE']);

const NotificationSettingsSchema = z.object({
  tradeConfirmations: z.boolean(),
  priceAlerts: z.boolean(),
  portfolioUpdates: z.boolean(),
  newListings: z.boolean(),
});

const UserSettingsSchema = z.object({
  defaultSlippage: z.number().min(0.1).max(50).openapi({ example: 0.5 }),
  defaultChain: ChainIdSchema,
  notifications: NotificationSettingsSchema,
  autoApprove: z.boolean(),
  maxTradeSize: z.number().optional().openapi({ description: 'Max trade size in USD' }),
});

const UserSchema = z.object({
  id: z.string(),
  telegramId: z.string().optional(),
  telegramUsername: z.string().optional(),
  email: z.string().optional(),
  tier: UserTierSchema,
  referralCode: z.string().openapi({ example: 'CHABCDEF' }),
  settings: UserSettingsSchema,
  createdAt: z.string(),
});

const WalletSchema = z.object({
  id: z.string(),
  chainId: ChainIdSchema,
  address: z.string(),
  label: z.string().optional(),
  isDefault: z.boolean(),
  createdAt: z.string(),
});

const ReferralStatsSchema = z.object({
  code: z.string(),
  currentTier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'DIAMOND']),
  totalReferrals: z.number(),
  activeReferrals: z.number(),
  weeklyVolume: z.number(),
  totalVolume: z.number(),
  totalEarningsUsd: z.number(),
  pendingEarningsUsd: z.number(),
  tierBenefits: z.object({
    referrerShare: z.number().openapi({ example: 25, description: 'Percentage of fees earned' }),
    refereeDiscount: z.number().openapi({ example: 7.5, description: 'Discount for referees' }),
  }),
  nextTier: z.object({
    name: z.string(),
    volumeRequired: z.number(),
    volumeRemaining: z.number(),
  }).optional(),
});

const PointsSchema = z.object({
  totalPoints: z.number(),
  tradingPoints: z.number(),
  referralPoints: z.number(),
  bonusPoints: z.number(),
  rank: z.number().optional().openapi({ description: 'Leaderboard rank' }),
  multipliers: z.object({
    multiChain: z.number().openapi({ example: 2.0, description: '2x for using multiple chains' }),
  }),
});

// ============================================================================
// Routes
// ============================================================================

const getMeRoute = createRoute({
  method: 'get',
  path: '/user/me',
  tags: ['Account'],
  summary: 'Get current user',
  description: 'Get the authenticated user\'s profile',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'User profile',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const updateSettingsRoute = createRoute({
  method: 'patch',
  path: '/user/settings',
  tags: ['Account'],
  summary: 'Update settings',
  description: 'Update user settings',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UserSettingsSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserSettingsSchema } },
      description: 'Updated settings',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const getWalletsRoute = createRoute({
  method: 'get',
  path: '/user/wallets',
  tags: ['Account'],
  summary: 'List wallets',
  description: 'Get all connected wallets',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    query: z.object({
      chainId: ChainIdSchema.optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            wallets: z.array(WalletSchema),
          }),
        },
      },
      description: 'List of wallets',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const addWalletRoute = createRoute({
  method: 'post',
  path: '/user/wallets',
  tags: ['Account'],
  summary: 'Add wallet',
  description: 'Connect a new wallet address',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            chainId: ChainIdSchema,
            address: z.string(),
            label: z.string().optional(),
            signature: z.string().optional().openapi({ description: 'Signature proving ownership (optional)' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: WalletSchema } },
      description: 'Wallet added',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid address or already exists',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const updateWalletRoute = createRoute({
  method: 'patch',
  path: '/user/wallets/{walletId}',
  tags: ['Account'],
  summary: 'Update wallet',
  description: 'Update wallet label or set as default',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    params: z.object({
      walletId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            label: z.string().optional(),
            isDefault: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: WalletSchema } },
      description: 'Wallet updated',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Wallet not found',
    },
  },
});

const deleteWalletRoute = createRoute({
  method: 'delete',
  path: '/user/wallets/{walletId}',
  tags: ['Account'],
  summary: 'Remove wallet',
  description: 'Disconnect a wallet',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    params: z.object({
      walletId: z.string(),
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
      description: 'Wallet removed',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Wallet not found',
    },
  },
});

const getReferralStatsRoute = createRoute({
  method: 'get',
  path: '/user/referrals',
  tags: ['Account'],
  summary: 'Get referral stats',
  description: 'Get referral program statistics and earnings',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: ReferralStatsSchema } },
      description: 'Referral statistics',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const getReferralLinkRoute = createRoute({
  method: 'get',
  path: '/user/referral-link',
  tags: ['Account'],
  summary: 'Get referral link',
  description: 'Get shareable referral links for different platforms',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            links: z.object({
              telegram: z.string().openapi({ example: 'https://t.me/ChainHopperBot?start=CHABCDEF' }),
              web: z.string().openapi({ example: 'https://chainhopper.io/r/CHABCDEF' }),
            }),
            shareText: z.string().openapi({ description: 'Pre-formatted share message' }),
          }),
        },
      },
      description: 'Referral links',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const getPointsRoute = createRoute({
  method: 'get',
  path: '/user/points',
  tags: ['Account'],
  summary: 'Get points balance',
  description: 'Get points program balance and breakdown',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: PointsSchema } },
      description: 'Points balance',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const getTierInfoRoute = createRoute({
  method: 'get',
  path: '/user/tier',
  tags: ['Account'],
  summary: 'Get tier info',
  description: 'Get current tier and requirements for upgrades',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            currentTier: UserTierSchema,
            profitSharePercent: z.number().openapi({ example: 15 }),
            hopperBalance: z.number().openapi({ description: '$HOPPER token balance' }),
            veHopperBalance: z.number().openapi({ description: 'veHOPPER staking balance' }),
            tiers: z.array(z.object({
              name: UserTierSchema,
              profitSharePercent: z.number(),
              requirement: z.string(),
              isCurrent: z.boolean(),
            })),
          }),
        },
      },
      description: 'Tier information',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

// ============================================================================
// Router
// ============================================================================

export const userRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getMeRoute, async (c) => {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch from database
    return c.json({
      id: userId,
      telegramId: '123456789',
      telegramUsername: 'trader_joe',
      tier: 'FREE' as const,
      referralCode: 'CHABCDEF',
      settings: {
        defaultSlippage: 0.5,
        defaultChain: 'base' as const,
        notifications: {
          tradeConfirmations: true,
          priceAlerts: true,
          portfolioUpdates: true,
          newListings: false,
        },
        autoApprove: false,
      },
      createdAt: new Date().toISOString(),
    }, 200);
  })
  .openapi(updateSettingsRoute, async (c) => {
    const userId = c.get('userId');
    const updates = c.req.valid('json');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Update in database
    const settings = {
      defaultSlippage: updates.defaultSlippage ?? 0.5,
      defaultChain: updates.defaultChain ?? ('base' as const),
      notifications: {
        tradeConfirmations: updates.notifications?.tradeConfirmations ?? true,
        priceAlerts: updates.notifications?.priceAlerts ?? true,
        portfolioUpdates: updates.notifications?.portfolioUpdates ?? true,
        newListings: updates.notifications?.newListings ?? false,
      },
      autoApprove: updates.autoApprove ?? false,
      maxTradeSize: updates.maxTradeSize,
    };

    return c.json(settings, 200);
  })
  .openapi(getWalletsRoute, async (c) => {
    const { chainId } = c.req.valid('query');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch from database
    const wallets = [
      {
        id: 'wallet_1',
        chainId: 'base' as const,
        address: '0x1234...5678',
        label: 'Main Wallet',
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ];

    return c.json({ wallets }, 200);
  })
  .openapi(addWalletRoute, async (c) => {
    const { chainId, address, label } = c.req.valid('json');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Validate address and store in database
    const wallet = {
      id: `wallet_${crypto.randomUUID().slice(0, 8)}`,
      chainId,
      address,
      label,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    return c.json(wallet, 201);
  })
  .openapi(updateWalletRoute, async (c) => {
    const { walletId } = c.req.valid('param');
    const { label, isDefault } = c.req.valid('json');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Update in database
    return c.json({
      id: walletId,
      chainId: 'base' as const,
      address: '0x1234...5678',
      label: label ?? 'Main Wallet',
      isDefault: isDefault ?? true,
      createdAt: new Date().toISOString(),
    }, 200);
  })
  .openapi(deleteWalletRoute, async (c) => {
    const { walletId } = c.req.valid('param');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Delete from database
    return c.json({
      success: true,
      message: `Wallet ${walletId} has been removed`,
    }, 200);
  })
  .openapi(getReferralStatsRoute, async (c) => {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch from database
    return c.json({
      code: 'CHABCDEF',
      currentTier: 'SILVER' as const,
      totalReferrals: 12,
      activeReferrals: 8,
      weeklyVolume: 25000.00,
      totalVolume: 150000.00,
      totalEarningsUsd: 375.00,
      pendingEarningsUsd: 45.00,
      tierBenefits: {
        referrerShare: 25,
        refereeDiscount: 7.5,
      },
      nextTier: {
        name: 'GOLD',
        volumeRequired: 50000,
        volumeRemaining: 25000,
      },
    }, 200);
  })
  .openapi(getReferralLinkRoute, async (c) => {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    const code = 'CHABCDEF'; // TODO: Get from user record

    return c.json({
      code,
      links: {
        telegram: `https://t.me/ChainHopperBot?start=${code}`,
        web: `https://chainhopper.io/r/${code}`,
      },
      shareText: `Trade crypto across 15+ chains with zero fees on losing trades! Use my referral code ${code} for a discount: https://t.me/ChainHopperBot?start=${code}`,
    }, 200);
  })
  .openapi(getPointsRoute, async (c) => {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch from database
    return c.json({
      totalPoints: 5250.00,
      tradingPoints: 4000.00,
      referralPoints: 1000.00,
      bonusPoints: 250.00,
      rank: 1523,
      multipliers: {
        multiChain: 2.0,
      },
    }, 200);
  })
  .openapi(getTierInfoRoute, async (c) => {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch from database and on-chain
    return c.json({
      currentTier: 'FREE' as const,
      profitSharePercent: 15,
      hopperBalance: 0,
      veHopperBalance: 0,
      tiers: [
        { name: 'FREE' as const, profitSharePercent: 15, requirement: 'None', isCurrent: true },
        { name: 'HOLDER' as const, profitSharePercent: 10, requirement: 'Hold 1,000 $HOPPER', isCurrent: false },
        { name: 'STAKER' as const, profitSharePercent: 5, requirement: 'Stake 10,000 veHOPPER', isCurrent: false },
        { name: 'ENTERPRISE' as const, profitSharePercent: 3, requirement: 'Custom agreement', isCurrent: false },
      ],
    }, 200);
  });
