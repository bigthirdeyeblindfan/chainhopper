import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { healthRoutes } from './routes/health.js';
import { openApiRoutes } from './routes/openapi.js';

export type AppEnv = {
  Variables: {
    requestId: string;
  };
};

export const app = new OpenAPIHono<AppEnv>();

// Middleware
app.use('*', logger());
app.use('*', timing());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);

// Request ID middleware
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});

// Routes
app.route('/', healthRoutes);
app.route('/', openApiRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'ChainHopper API',
    version: '0.1.0',
    docs: '/docs',
  });
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.path} not found`,
      },
      timestamp: new Date().toISOString(),
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error(`[${c.get('requestId')}] Error:`, err);
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
      },
      timestamp: new Date().toISOString(),
    },
    500
  );
});
