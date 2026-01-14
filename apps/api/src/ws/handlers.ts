/**
 * WebSocket Message Handlers
 *
 * Processes incoming WebSocket messages and routes them
 * to appropriate handlers.
 */

import { connectionManager } from './connection-manager.js';
import type {
  WebSocketMessage,
  WebSocketEventType,
  SubscriptionRequest,
  AuthenticateMessage,
  PriceSubscription,
  ClientConnection,
} from './types.js';

/**
 * Handle incoming WebSocket message
 */
export async function handleMessage(
  connectionId: string,
  data: string
): Promise<void> {
  let message: WebSocketMessage;

  try {
    message = JSON.parse(data);
  } catch {
    sendError(connectionId, 'INVALID_JSON', 'Message must be valid JSON');
    return;
  }

  if (!message.type) {
    sendError(connectionId, 'MISSING_TYPE', 'Message must have a type');
    return;
  }

  const connection = connectionManager.getConnection(connectionId);
  if (!connection) {
    return;
  }

  // Route message to appropriate handler
  switch (message.type) {
    case 'system:pong':
      handlePong(connectionId);
      break;

    case 'subscribe':
      await handleSubscribe(connectionId, message.payload as SubscriptionRequest);
      break;

    case 'unsubscribe':
      await handleUnsubscribe(connectionId, message.payload as SubscriptionRequest);
      break;

    case 'price:subscribe':
      await handlePriceSubscribe(connectionId, message.payload as PriceSubscription);
      break;

    case 'price:unsubscribe':
      await handlePriceUnsubscribe(connectionId, message.payload as PriceSubscription);
      break;

    default:
      // Check if authenticated for protected operations
      if (requiresAuth(message.type) && !connection.authenticated) {
        sendError(connectionId, 'UNAUTHORIZED', 'Authentication required');
        return;
      }

      sendError(connectionId, 'UNKNOWN_TYPE', `Unknown message type: ${message.type}`);
  }
}

/**
 * Handle authentication
 */
export async function handleAuthenticate(
  connectionId: string,
  message: AuthenticateMessage
): Promise<boolean> {
  const { token, apiKey, telegramInitData } = message.payload;

  // In a real implementation, verify the credentials
  // For now, we'll do a basic check

  let userId: string | null = null;

  if (token) {
    // Verify JWT token
    // userId = await verifyJWT(token);
    userId = 'user_from_jwt'; // Placeholder
  } else if (apiKey) {
    // Verify API key
    // userId = await verifyApiKey(apiKey);
    userId = 'user_from_api_key'; // Placeholder
  } else if (telegramInitData) {
    // Verify Telegram init data
    // userId = await verifyTelegramAuth(telegramInitData);
    userId = 'user_from_telegram'; // Placeholder
  }

  if (userId) {
    connectionManager.authenticateConnection(connectionId, userId);
    connectionManager.sendToConnection(connectionId, 'system:connected', {
      connectionId,
      userId,
      serverTime: new Date().toISOString(),
      version: '0.1.0',
      authenticated: true,
    });
    return true;
  }

  sendError(connectionId, 'AUTH_FAILED', 'Invalid credentials');
  return false;
}

/**
 * Handle pong response
 */
function handlePong(connectionId: string): void {
  connectionManager.updateLastPing(connectionId);
}

/**
 * Handle channel subscription
 */
async function handleSubscribe(
  connectionId: string,
  request: SubscriptionRequest
): Promise<void> {
  const { channel, params } = request;

  // Build channel key with optional params
  let channelKey = channel;
  if (params?.chainId) {
    channelKey += `:${params.chainId}`;
  }
  if (params?.userId) {
    channelKey += `:user:${params.userId}`;
  }

  const success = connectionManager.subscribe(connectionId, channelKey);

  connectionManager.sendToConnection(connectionId, 'subscribe', {
    channel,
    subscribed: success,
    params,
  });
}

/**
 * Handle channel unsubscription
 */
async function handleUnsubscribe(
  connectionId: string,
  request: SubscriptionRequest
): Promise<void> {
  const { channel, params } = request;

  let channelKey = channel;
  if (params?.chainId) {
    channelKey += `:${params.chainId}`;
  }
  if (params?.userId) {
    channelKey += `:user:${params.userId}`;
  }

  const success = connectionManager.unsubscribe(connectionId, channelKey);

  connectionManager.sendToConnection(connectionId, 'unsubscribe', {
    channel,
    subscribed: !success,
    params,
  });
}

/**
 * Handle price subscription
 */
async function handlePriceSubscribe(
  connectionId: string,
  subscription: PriceSubscription
): Promise<void> {
  const { chainId, tokenAddresses } = subscription;

  // Subscribe to each token's price channel
  for (const address of tokenAddresses) {
    const channelKey = `prices:${chainId}:${address.toLowerCase()}`;
    connectionManager.subscribe(connectionId, channelKey);
  }

  connectionManager.sendToConnection(connectionId, 'price:subscribe', {
    chainId,
    tokenAddresses,
    subscribed: true,
  });
}

/**
 * Handle price unsubscription
 */
async function handlePriceUnsubscribe(
  connectionId: string,
  subscription: PriceSubscription
): Promise<void> {
  const { chainId, tokenAddresses } = subscription;

  for (const address of tokenAddresses) {
    const channelKey = `prices:${chainId}:${address.toLowerCase()}`;
    connectionManager.unsubscribe(connectionId, channelKey);
  }

  connectionManager.sendToConnection(connectionId, 'price:unsubscribe', {
    chainId,
    tokenAddresses,
    subscribed: false,
  });
}

/**
 * Check if message type requires authentication
 */
function requiresAuth(type: WebSocketEventType): boolean {
  const publicTypes: WebSocketEventType[] = [
    'system:ping',
    'system:pong',
    'price:subscribe',
    'price:unsubscribe',
    'price:update',
  ];

  return !publicTypes.includes(type);
}

/**
 * Send error message to connection
 */
function sendError(connectionId: string, code: string, message: string): void {
  connectionManager.sendToConnection(connectionId, 'system:error', {
    code,
    message,
  });
}

// ============ Event Emitters (for use by other parts of the API) ============

/**
 * Emit price update to all subscribers
 */
export function emitPriceUpdate(
  chainId: number,
  tokenAddress: string,
  priceData: {
    symbol: string;
    priceUsd: string;
    priceNative: string;
    change24h: number;
    volume24h: string;
  }
): number {
  const channelKey = `prices:${chainId}:${tokenAddress.toLowerCase()}`;

  return connectionManager.broadcastToChannel(channelKey, 'price:update', {
    chainId,
    tokenAddress,
    ...priceData,
  });
}

/**
 * Emit trade event to user
 */
export function emitTradeEvent(
  userId: string,
  tradeEvent: {
    tradeId: string;
    chainId: number;
    status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
    tokenIn: { address: string; symbol: string; amount: string };
    tokenOut: { address: string; symbol: string; amount: string };
    txHash?: string;
    error?: string;
  }
): number {
  const eventType = `trade:${tradeEvent.status}` as WebSocketEventType;

  return connectionManager.sendToUser(userId, eventType, {
    ...tradeEvent,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Emit portfolio update to user
 */
export function emitPortfolioUpdate(
  userId: string,
  portfolioData: {
    chainId: number;
    totalValueUsd: string;
    change24h: number;
    holdings: Array<{
      tokenAddress: string;
      symbol: string;
      balance: string;
      valueUsd: string;
      price: string;
      change24h: number;
    }>;
  }
): number {
  return connectionManager.sendToUser(userId, 'portfolio:update', {
    userId,
    ...portfolioData,
  });
}

/**
 * Emit balance update to user
 */
export function emitBalanceUpdate(
  userId: string,
  balanceData: {
    chainId: number;
    tokenAddress: string;
    symbol: string;
    previousBalance: string;
    newBalance: string;
    changeAmount: string;
    valueUsd: string;
    reason: 'trade' | 'transfer_in' | 'transfer_out' | 'sync';
  }
): number {
  return connectionManager.sendToUser(userId, 'portfolio:balance', {
    userId,
    ...balanceData,
  });
}

/**
 * Emit P&L update to user
 */
export function emitPnLUpdate(
  userId: string,
  pnlData: {
    chainId?: number;
    realizedPnl: string;
    unrealizedPnl: string;
    totalPnl: string;
    totalPnlPercent: number;
    period: '24h' | '7d' | '30d' | 'all';
  }
): number {
  return connectionManager.sendToUser(userId, 'portfolio:pnl', {
    userId,
    ...pnlData,
  });
}

/**
 * Emit system maintenance notification
 */
export function emitMaintenanceNotice(
  scheduled: boolean,
  startTime: Date,
  message: string,
  endTime?: Date
): number {
  return connectionManager.broadcastToAll('system:maintenance', {
    scheduled,
    startTime: startTime.toISOString(),
    endTime: endTime?.toISOString(),
    message,
  });
}
