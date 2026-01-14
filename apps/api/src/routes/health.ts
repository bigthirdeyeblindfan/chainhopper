import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../app.js';
import { getWebSocketStats } from '../ws/index.js';

const startTime = Date.now();

// Zod schemas for OpenAPI
const ChainStatusSchema = z.object({
  chainId: z.string().openapi({ example: 'ethereum' }),
  status: z.enum(['up', 'down']).openapi({ example: 'up' }),
  latency: z.number().openapi({ example: 45 }),
});

const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']).openapi({ example: 'healthy' }),
  version: z.string().openapi({ example: '0.1.0' }),
  uptime: z.number().openapi({ example: 12345, description: 'Uptime in seconds' }),
  chains: z.array(ChainStatusSchema),
});

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Health check endpoint',
  description: 'Returns the health status of the API and connected chains',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: 'Health status response',
    },
  },
});

const readinessRoute = createRoute({
  method: 'get',
  path: '/ready',
  tags: ['System'],
  summary: 'Readiness check',
  description: 'Returns 200 if the service is ready to accept traffic',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            ready: z.boolean(),
          }),
        },
      },
      description: 'Readiness response',
    },
    503: {
      content: {
        'application/json': {
          schema: z.object({
            ready: z.boolean(),
            reason: z.string(),
          }),
        },
      },
      description: 'Service not ready',
    },
  },
});

const livenessRoute = createRoute({
  method: 'get',
  path: '/live',
  tags: ['System'],
  summary: 'Liveness check',
  description: 'Returns 200 if the service is alive',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            alive: z.boolean(),
          }),
        },
      },
      description: 'Liveness response',
    },
  },
});

export const healthRoutes = new OpenAPIHono<AppEnv>()
  .openapi(healthRoute, async (c) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    // TODO: Implement actual chain health checks via adapters
    const mockChainStatus: { chainId: string; status: 'up' | 'down'; latency: number }[] = [
      { chainId: 'ethereum', status: 'up', latency: 45 },
      { chainId: 'base', status: 'up', latency: 32 },
      { chainId: 'sonic', status: 'up', latency: 28 },
      { chainId: 'ton', status: 'up', latency: 65 },
    ];

    const unhealthyChains = mockChainStatus.filter((chain) => chain.status === 'down').length;
    const status =
      unhealthyChains === 0
        ? 'healthy'
        : unhealthyChains < mockChainStatus.length / 2
          ? 'degraded'
          : 'unhealthy';

    return c.json(
      {
        status,
        version: '0.1.0',
        uptime: uptimeSeconds,
        chains: mockChainStatus,
      },
      200
    );
  })
  .openapi(readinessRoute, async (c) => {
    // TODO: Check database connection, cache, etc.
    const isReady = true;

    if (!isReady) {
      return c.json({ ready: false, reason: 'Dependencies not ready' }, 503);
    }

    return c.json({ ready: true }, 200);
  })
  .openapi(livenessRoute, async (c) => {
    return c.json({ alive: true }, 200);
  })
  // WebSocket stats endpoint (not OpenAPI documented)
  .get('/ws/stats', (c) => {
    const stats = getWebSocketStats();
    return c.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  });
