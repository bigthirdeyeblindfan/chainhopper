import 'dotenv/config';
import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = parseInt(process.env['PORT'] ?? '3000', 10);

console.log(`Starting ChainHopper API server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`ChainHopper API running at http://localhost:${port}`);
console.log(`OpenAPI docs available at http://localhost:${port}/docs`);
