/**
 * WebSocket Module for ChainHopper API
 *
 * Provides real-time updates for:
 * - Price feeds
 * - Trade status
 * - Portfolio changes
 * - System notifications
 */

// Server setup
export {
  initWebSocketServer,
  getWebSocketServer,
  getWebSocketStats,
  shutdownWebSocketServer,
} from './server.js';

// Connection management
export { connectionManager } from './connection-manager.js';

// Event emitters for use by other modules
export {
  emitPriceUpdate,
  emitTradeEvent,
  emitPortfolioUpdate,
  emitBalanceUpdate,
  emitPnLUpdate,
  emitMaintenanceNotice,
} from './handlers.js';

// Types
export type {
  WebSocketEventType,
  WebSocketMessage,
  WebSocketError,
  PriceUpdate,
  PriceSubscription,
  TradeEvent,
  TradeStatus,
  PortfolioUpdate,
  PortfolioHolding,
  BalanceUpdate,
  PnLUpdate,
  SystemConnected,
  SystemMaintenance,
  SubscriptionChannel,
  SubscriptionRequest,
  SubscriptionResponse,
  ClientConnection,
  AuthenticateMessage,
  AuthenticateResponse,
} from './types.js';
