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

const TokenBalanceSchema = z.object({
  token: z.object({
    address: z.string(),
    chainId: ChainIdSchema,
    symbol: z.string(),
    name: z.string(),
    decimals: z.number(),
    logoUri: z.string().optional(),
  }),
  balance: z.string().openapi({ description: 'Balance in smallest unit' }),
  balanceFormatted: z.string().openapi({ example: '1,234.56' }),
  valueUsd: z.number().openapi({ example: 1234.56 }),
  priceUsd: z.number().optional(),
  priceChange24h: z.number().optional(),
});

const PositionSchema = z.object({
  id: z.string(),
  chainId: ChainIdSchema,
  token: z.object({
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    decimals: z.number(),
    logoUri: z.string().optional(),
  }),
  amount: z.string(),
  amountFormatted: z.string(),
  entryPrice: z.number().openapi({ description: 'Entry price in USD' }),
  currentPrice: z.number().openapi({ description: 'Current price in USD' }),
  costBasis: z.number().openapi({ description: 'Total cost in USD' }),
  currentValue: z.number().openapi({ description: 'Current value in USD' }),
  unrealizedPnl: z.number().openapi({ description: 'Unrealized P&L in USD' }),
  unrealizedPnlPercent: z.number().openapi({ example: 15.5, description: 'P&L as percentage' }),
  isOpen: z.boolean(),
  openedAt: z.string(),
  closedAt: z.string().optional(),
});

const PortfolioSummarySchema = z.object({
  totalValueUsd: z.number().openapi({ example: 12500.00 }),
  totalCostBasisUsd: z.number().openapi({ example: 10000.00 }),
  totalUnrealizedPnlUsd: z.number().openapi({ example: 2500.00 }),
  totalUnrealizedPnlPercent: z.number().openapi({ example: 25.0 }),
  totalRealizedPnlUsd: z.number().openapi({ example: 1500.00 }),
  totalFeePaidUsd: z.number().openapi({ example: 150.00, description: 'Total profit-share fees paid' }),
  byChain: z.array(z.object({
    chainId: ChainIdSchema,
    valueUsd: z.number(),
    pnlUsd: z.number(),
    pnlPercent: z.number(),
  })),
});

const TradeHistorySchema = z.object({
  id: z.string(),
  chainId: ChainIdSchema,
  type: z.enum(['buy', 'sell']),
  tokenIn: z.object({
    symbol: z.string(),
    amount: z.string(),
    amountUsd: z.number(),
  }),
  tokenOut: z.object({
    symbol: z.string(),
    amount: z.string(),
    amountUsd: z.number(),
  }),
  profit: z.number().optional().openapi({ description: 'Realized profit (if sell)' }),
  profitPercent: z.number().optional(),
  fee: z.number().openapi({ description: 'Profit-share fee taken' }),
  txHash: z.string(),
  executedAt: z.string(),
});

const StatsSchema = z.object({
  totalTrades: z.number(),
  totalVolumeUsd: z.number(),
  totalProfitUsd: z.number(),
  totalLossUsd: z.number(),
  totalFeePaidUsd: z.number(),
  winRate: z.number().openapi({ example: 62.5, description: 'Win rate percentage' }),
  bestTrade: z.object({
    tokenSymbol: z.string(),
    profitUsd: z.number(),
    profitPercent: z.number(),
  }).optional(),
  worstTrade: z.object({
    tokenSymbol: z.string(),
    lossUsd: z.number(),
    lossPercent: z.number(),
  }).optional(),
  averageTradeSize: z.number(),
  averageHoldTime: z.number().openapi({ description: 'Average hold time in seconds' }),
});

// ============================================================================
// Routes
// ============================================================================

const getBalancesRoute = createRoute({
  method: 'get',
  path: '/portfolio/balances',
  tags: ['Portfolio'],
  summary: 'Get token balances',
  description: 'Get all token balances across connected wallets',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    query: z.object({
      chainId: ChainIdSchema.optional(),
      includeZero: z.string().optional().openapi({ description: 'Include zero balances', example: 'false' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            balances: z.array(TokenBalanceSchema),
            totalValueUsd: z.number(),
          }),
        },
      },
      description: 'Token balances',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const getPositionsRoute = createRoute({
  method: 'get',
  path: '/portfolio/positions',
  tags: ['Portfolio'],
  summary: 'Get open positions',
  description: 'Get all open trading positions with P&L',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    query: z.object({
      chainId: ChainIdSchema.optional(),
      status: z.enum(['open', 'closed', 'all']).optional().default('open'),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            positions: z.array(PositionSchema),
            total: z.number(),
          }),
        },
      },
      description: 'Trading positions',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const getPositionRoute = createRoute({
  method: 'get',
  path: '/portfolio/positions/{positionId}',
  tags: ['Portfolio'],
  summary: 'Get position details',
  description: 'Get detailed information about a specific position',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    params: z.object({
      positionId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PositionSchema.extend({
            trades: z.array(TradeHistorySchema),
          }),
        },
      },
      description: 'Position details with trade history',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Position not found',
    },
  },
});

const getSummaryRoute = createRoute({
  method: 'get',
  path: '/portfolio/summary',
  tags: ['Portfolio'],
  summary: 'Get portfolio summary',
  description: 'Get aggregated portfolio metrics across all chains',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: PortfolioSummarySchema } },
      description: 'Portfolio summary',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const getHistoryRoute = createRoute({
  method: 'get',
  path: '/portfolio/history',
  tags: ['Portfolio'],
  summary: 'Get trade history',
  description: 'Get paginated trade history with P&L',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    query: z.object({
      chainId: ChainIdSchema.optional(),
      startDate: z.string().optional().openapi({ example: '2025-01-01' }),
      endDate: z.string().optional().openapi({ example: '2025-01-31' }),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            trades: z.array(TradeHistorySchema),
            total: z.number(),
            summary: z.object({
              totalTrades: z.number(),
              totalVolumeUsd: z.number(),
              totalProfitUsd: z.number(),
              totalFeesPaidUsd: z.number(),
            }),
          }),
        },
      },
      description: 'Trade history',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const getStatsRoute = createRoute({
  method: 'get',
  path: '/portfolio/stats',
  tags: ['Portfolio'],
  summary: 'Get trading stats',
  description: 'Get lifetime trading statistics',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: StatsSchema } },
      description: 'Trading statistics',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not authenticated',
    },
  },
});

const getPnlChartRoute = createRoute({
  method: 'get',
  path: '/portfolio/pnl-chart',
  tags: ['Portfolio'],
  summary: 'Get P&L chart data',
  description: 'Get historical P&L data for charting',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  request: {
    query: z.object({
      period: z.enum(['1d', '7d', '30d', '90d', '1y', 'all']).optional().default('30d'),
      chainId: ChainIdSchema.optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            dataPoints: z.array(z.object({
              timestamp: z.string(),
              valueUsd: z.number(),
              pnlUsd: z.number(),
              pnlPercent: z.number(),
            })),
            period: z.string(),
          }),
        },
      },
      description: 'P&L chart data',
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

export const portfolioRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getBalancesRoute, async (c) => {
    const { chainId, includeZero } = c.req.valid('query');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch real balances from adapters
    const balances = [
      {
        token: {
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          chainId: 'base' as const,
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
        },
        balance: '2500000000000000000',
        balanceFormatted: '2.50',
        valueUsd: 8125.00,
        priceUsd: 3250.00,
        priceChange24h: 2.5,
      },
      {
        token: {
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          chainId: 'base' as const,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        balance: '5000000000',
        balanceFormatted: '5,000.00',
        valueUsd: 5000.00,
        priceUsd: 1.00,
        priceChange24h: 0.0,
      },
    ];

    return c.json({
      balances,
      totalValueUsd: balances.reduce((sum, b) => sum + b.valueUsd, 0),
    }, 200);
  })
  .openapi(getPositionsRoute, async (c) => {
    const { chainId, status, limit, offset } = c.req.valid('query');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch real positions from database
    const positions = [
      {
        id: 'pos_123',
        chainId: 'base' as const,
        token: {
          address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
          symbol: 'DEGEN',
          name: 'Degen',
          decimals: 18,
        },
        amount: '100000000000000000000000',
        amountFormatted: '100,000',
        entryPrice: 0.015,
        currentPrice: 0.018,
        costBasis: 1500.00,
        currentValue: 1800.00,
        unrealizedPnl: 300.00,
        unrealizedPnlPercent: 20.0,
        isOpen: true,
        openedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    return c.json({
      positions,
      total: positions.length,
    }, 200);
  })
  .openapi(getPositionRoute, async (c) => {
    const { positionId } = c.req.valid('param');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch from database
    return c.json({
      id: positionId,
      chainId: 'base' as const,
      token: {
        address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
        symbol: 'DEGEN',
        name: 'Degen',
        decimals: 18,
      },
      amount: '100000000000000000000000',
      amountFormatted: '100,000',
      entryPrice: 0.015,
      currentPrice: 0.018,
      costBasis: 1500.00,
      currentValue: 1800.00,
      unrealizedPnl: 300.00,
      unrealizedPnlPercent: 20.0,
      isOpen: true,
      openedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      trades: [
        {
          id: 'trade_1',
          chainId: 'base' as const,
          type: 'buy' as const,
          tokenIn: { symbol: 'ETH', amount: '500000000000000000', amountUsd: 1500.00 },
          tokenOut: { symbol: 'DEGEN', amount: '100000000000000000000000', amountUsd: 1500.00 },
          fee: 0,
          txHash: '0xabc123...',
          executedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ],
    }, 200);
  })
  .openapi(getSummaryRoute, async (c) => {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Calculate from database
    return c.json({
      totalValueUsd: 13125.00,
      totalCostBasisUsd: 10000.00,
      totalUnrealizedPnlUsd: 3125.00,
      totalUnrealizedPnlPercent: 31.25,
      totalRealizedPnlUsd: 1500.00,
      totalFeePaidUsd: 150.00,
      byChain: [
        { chainId: 'base' as const, valueUsd: 13125.00, pnlUsd: 3125.00, pnlPercent: 31.25 },
      ],
    }, 200);
  })
  .openapi(getHistoryRoute, async (c) => {
    const { chainId, startDate, endDate, limit, offset } = c.req.valid('query');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch from database
    return c.json({
      trades: [],
      total: 0,
      summary: {
        totalTrades: 0,
        totalVolumeUsd: 0,
        totalProfitUsd: 0,
        totalFeesPaidUsd: 0,
      },
    }, 200);
  })
  .openapi(getStatsRoute, async (c) => {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Fetch from database
    return c.json({
      totalTrades: 25,
      totalVolumeUsd: 50000.00,
      totalProfitUsd: 4500.00,
      totalLossUsd: 1000.00,
      totalFeePaidUsd: 350.00,
      winRate: 68.0,
      bestTrade: {
        tokenSymbol: 'DEGEN',
        profitUsd: 2500.00,
        profitPercent: 150.0,
      },
      worstTrade: {
        tokenSymbol: 'MEME',
        lossUsd: 500.00,
        lossPercent: -50.0,
      },
      averageTradeSize: 2000.00,
      averageHoldTime: 172800, // 2 days in seconds
    }, 200);
  })
  .openapi(getPnlChartRoute, async (c) => {
    const { period, chainId } = c.req.valid('query');
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);
    }

    // TODO: Generate chart data from database
    const now = Date.now();
    const dataPoints = Array.from({ length: 30 }, (_, i) => ({
      timestamp: new Date(now - (29 - i) * 86400000).toISOString(),
      valueUsd: 10000 + Math.random() * 3000,
      pnlUsd: 1000 + Math.random() * 2000,
      pnlPercent: 10 + Math.random() * 20,
    }));

    return c.json({
      dataPoints,
      period,
    }, 200);
  });
