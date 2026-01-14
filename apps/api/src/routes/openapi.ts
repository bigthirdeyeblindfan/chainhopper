import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import type { AppEnv } from '../app.js';

export const openApiRoutes = new OpenAPIHono<AppEnv>();

// OpenAPI JSON spec endpoint
openApiRoutes.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'ChainHopper API',
    version: '0.1.0',
    description: `
## ChainHopper Trading API

Multi-chain trading bot API with profit-share fee model.

### Features
- **15+ Chain Support**: Trade across TON, EVM chains, Sui, and more
- **Profit-Share Fees**: Only pay when you profit
- **Real-time Data**: WebSocket streams for prices and trades
- **Portfolio Tracking**: Cross-chain P&L tracking

### Authentication
Most endpoints require an API key passed via the \`X-API-Key\` header.

### Rate Limits
- Free tier: 60 requests/minute
- Holder tier: 300 requests/minute
- Staker tier: 1000 requests/minute
    `.trim(),
    contact: {
      name: 'ChainHopper Support',
      url: 'https://chainhopper.io',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
    {
      url: 'https://api.chainhopper.io',
      description: 'Production',
    },
  ],
  tags: [
    {
      name: 'System',
      description: 'Health checks and system status',
    },
    {
      name: 'Authentication',
      description: 'Login, tokens, and API keys',
    },
    {
      name: 'Trading',
      description: 'Quote and swap endpoints',
    },
    {
      name: 'Portfolio',
      description: 'Portfolio and position tracking',
    },
    {
      name: 'Account',
      description: 'User settings and wallets',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from /auth/telegram or /auth/refresh',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'API key in format: "Bearer chpr_xxx" or "ApiKey chpr_xxx"',
      },
    },
  },
});

// Swagger UI endpoint
openApiRoutes.get('/docs', swaggerUI({ url: '/openapi.json' }));
