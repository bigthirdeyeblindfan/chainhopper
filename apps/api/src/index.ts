import 'dotenv/config';
import { createServer } from 'http';
import { serve } from '@hono/node-server';
import { app } from './app.js';
import { initWebSocketServer, shutdownWebSocketServer, getWebSocketStats } from './ws/index.js';

const port = parseInt(process.env['PORT'] ?? '3000', 10);

console.log(`Starting ChainHopper API server on port ${port}...`);

// Create HTTP server with Hono
const server = serve({
  fetch: app.fetch,
  port,
  createServer,
});

// Initialize WebSocket server on the same HTTP server
initWebSocketServer(server);

console.log(`ChainHopper API running at http://localhost:${port}`);
console.log(`OpenAPI docs available at http://localhost:${port}/docs`);
console.log(`WebSocket server available at ws://localhost:${port}/ws`);

// Graceful shutdown handling
const shutdown = () => {
  console.log('\nShutting down gracefully...');
  shutdownWebSocketServer();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Log WebSocket stats every 60 seconds in development
if (process.env['NODE_ENV'] !== 'production') {
  setInterval(() => {
    const stats = getWebSocketStats();
    if (stats.connections > 0) {
      console.log('[WS Stats]', JSON.stringify(stats));
    }
  }, 60000);
}
