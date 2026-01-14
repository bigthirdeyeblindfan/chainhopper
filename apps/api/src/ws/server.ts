/**
 * WebSocket Server for ChainHopper
 *
 * Handles WebSocket upgrade requests and connection lifecycle.
 * Integrates with the main Hono HTTP server.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { connectionManager } from './connection-manager.js';
import { handleMessage, handleAuthenticate } from './handlers.js';
import type { ClientConnection, AuthenticateMessage } from './types.js';

let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(server: Server): WebSocketServer {
  wss = new WebSocketServer({
    server,
    path: '/ws',
    clientTracking: false, // We manage our own connections
  });

  wss.on('connection', handleConnection);

  wss.on('error', (error) => {
    console.error('[WS Server] Error:', error);
  });

  console.log('[WS] WebSocket server initialized on /ws');

  return wss;
}

/**
 * Handle new WebSocket connection
 */
function handleConnection(socket: WebSocket, request: IncomingMessage): void {
  const connectionId = crypto.randomUUID();

  // Extract client info from request
  const ip = request.headers['x-forwarded-for']?.toString() || request.socket.remoteAddress;
  const userAgent = request.headers['user-agent'];

  // Create connection record
  const connection: ClientConnection = {
    id: connectionId,
    userId: undefined,
    socket,
    subscriptions: new Set(),
    connectedAt: new Date(),
    lastPing: new Date(),
    authenticated: false,
    metadata: {
      ip,
      userAgent,
    },
  };

  connectionManager.addConnection(connection);

  // Send connection established message
  sendMessage(socket, 'system:connected', {
    connectionId,
    serverTime: new Date().toISOString(),
    version: '0.1.0',
    authenticated: false,
    message: 'Connected. Send authenticate message to access protected features.',
  });

  // Handle incoming messages
  socket.on('message', async (data) => {
    try {
      const message = data.toString();

      // Check for authentication message
      if (message.includes('"type":"authenticate"')) {
        const authMessage = JSON.parse(message) as AuthenticateMessage;
        await handleAuthenticate(connectionId, authMessage);
        return;
      }

      await handleMessage(connectionId, message);
    } catch (error) {
      console.error(`[WS] Error handling message from ${connectionId}:`, error);
      sendMessage(socket, 'system:error', {
        code: 'MESSAGE_ERROR',
        message: 'Failed to process message',
      });
    }
  });

  // Handle connection close
  socket.on('close', (code, reason) => {
    console.log(`[WS] Connection ${connectionId} closed: ${code} - ${reason.toString()}`);
    connectionManager.removeConnection(connectionId);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[WS] Connection ${connectionId} error:`, error);
    connectionManager.removeConnection(connectionId);
  });

  // Handle pong responses
  socket.on('pong', () => {
    connectionManager.updateLastPing(connectionId);
  });
}

/**
 * Send a message through a WebSocket
 */
function sendMessage<T>(socket: WebSocket, type: string, payload: T): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

/**
 * Get WebSocket server stats
 */
export function getWebSocketStats(): {
  connections: number;
  authenticated: number;
  subscriptions: Record<string, number>;
} {
  return {
    connections: connectionManager.getConnectionCount(),
    authenticated: connectionManager.getAuthenticatedCount(),
    subscriptions: connectionManager.getSubscriptionStats(),
  };
}

/**
 * Gracefully shutdown WebSocket server
 */
export function shutdownWebSocketServer(): void {
  if (wss) {
    connectionManager.shutdown();
    wss.close(() => {
      console.log('[WS] WebSocket server shut down');
    });
    wss = null;
  }
}
