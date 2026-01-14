/**
 * WebSocket Connection Manager
 *
 * Manages all active WebSocket connections, subscriptions,
 * and broadcasting of real-time events.
 */

import type {
  ClientConnection,
  WebSocketMessage,
  WebSocketEventType,
  SubscriptionChannel,
} from './types.js';

class ConnectionManager {
  private connections: Map<string, ClientConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private channelSubscriptions: Map<string, Set<string>> = new Map();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start ping interval to keep connections alive
    this.startPingInterval();
  }

  /**
   * Add a new connection
   */
  addConnection(connection: ClientConnection): void {
    this.connections.set(connection.id, connection);
    console.log(`[WS] Connection added: ${connection.id}`);
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from user connections
    if (connection.userId) {
      const userConns = this.userConnections.get(connection.userId);
      if (userConns) {
        userConns.delete(connectionId);
        if (userConns.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }
    }

    // Remove from all channel subscriptions
    connection.subscriptions.forEach((channel) => {
      const channelConns = this.channelSubscriptions.get(channel);
      if (channelConns) {
        channelConns.delete(connectionId);
        if (channelConns.size === 0) {
          this.channelSubscriptions.delete(channel);
        }
      }
    });

    this.connections.delete(connectionId);
    console.log(`[WS] Connection removed: ${connectionId}`);
  }

  /**
   * Authenticate a connection
   */
  authenticateConnection(connectionId: string, userId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    connection.userId = userId;
    connection.authenticated = true;

    // Add to user connections map
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    console.log(`[WS] Connection ${connectionId} authenticated as user ${userId}`);
    return true;
  }

  /**
   * Subscribe a connection to a channel
   */
  subscribe(connectionId: string, channel: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    connection.subscriptions.add(channel);

    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
    }
    this.channelSubscriptions.get(channel)!.add(connectionId);

    console.log(`[WS] Connection ${connectionId} subscribed to ${channel}`);
    return true;
  }

  /**
   * Unsubscribe a connection from a channel
   */
  unsubscribe(connectionId: string, channel: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    connection.subscriptions.delete(channel);

    const channelConns = this.channelSubscriptions.get(channel);
    if (channelConns) {
      channelConns.delete(connectionId);
      if (channelConns.size === 0) {
        this.channelSubscriptions.delete(channel);
      }
    }

    console.log(`[WS] Connection ${connectionId} unsubscribed from ${channel}`);
    return true;
  }

  /**
   * Send a message to a specific connection
   */
  sendToConnection<T>(connectionId: string, type: WebSocketEventType, payload: T): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    try {
      connection.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[WS] Failed to send to ${connectionId}:`, error);
      return false;
    }
  }

  /**
   * Send a message to a specific user (all their connections)
   */
  sendToUser<T>(userId: string, type: WebSocketEventType, payload: T): number {
    const userConns = this.userConnections.get(userId);
    if (!userConns) return 0;

    let sent = 0;
    userConns.forEach((connectionId) => {
      if (this.sendToConnection(connectionId, type, payload)) {
        sent++;
      }
    });

    return sent;
  }

  /**
   * Broadcast to all subscribers of a channel
   */
  broadcastToChannel<T>(channel: string, type: WebSocketEventType, payload: T): number {
    const channelConns = this.channelSubscriptions.get(channel);
    if (!channelConns) return 0;

    let sent = 0;
    channelConns.forEach((connectionId) => {
      if (this.sendToConnection(connectionId, type, payload)) {
        sent++;
      }
    });

    return sent;
  }

  /**
   * Broadcast to all authenticated connections
   */
  broadcastToAuthenticated<T>(type: WebSocketEventType, payload: T): number {
    let sent = 0;
    this.connections.forEach((connection) => {
      if (connection.authenticated && connection.socket.readyState === WebSocket.OPEN) {
        if (this.sendToConnection(connection.id, type, payload)) {
          sent++;
        }
      }
    });
    return sent;
  }

  /**
   * Broadcast to all connections
   */
  broadcastToAll<T>(type: WebSocketEventType, payload: T): number {
    let sent = 0;
    this.connections.forEach((connection) => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        if (this.sendToConnection(connection.id, type, payload)) {
          sent++;
        }
      }
    });
    return sent;
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): ClientConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections for a user
   */
  getUserConnections(userId: string): ClientConnection[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];

    return Array.from(connectionIds)
      .map((id) => this.connections.get(id))
      .filter((c): c is ClientConnection => c !== undefined);
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get authenticated connection count
   */
  getAuthenticatedCount(): number {
    let count = 0;
    this.connections.forEach((c) => {
      if (c.authenticated) count++;
    });
    return count;
  }

  /**
   * Get channel subscriber count
   */
  getChannelSubscriberCount(channel: string): number {
    return this.channelSubscriptions.get(channel)?.size ?? 0;
  }

  /**
   * Get all channel subscription counts
   */
  getSubscriptionStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.channelSubscriptions.forEach((conns, channel) => {
      stats[channel] = conns.size;
    });
    return stats;
  }

  /**
   * Start ping interval to keep connections alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = new Date();
      this.connections.forEach((connection, id) => {
        // Check if connection is stale (no ping in 60 seconds)
        const timeSinceLastPing = now.getTime() - connection.lastPing.getTime();
        if (timeSinceLastPing > 60000) {
          console.log(`[WS] Connection ${id} stale, closing`);
          connection.socket.close();
          this.removeConnection(id);
          return;
        }

        // Send ping
        if (connection.socket.readyState === WebSocket.OPEN) {
          this.sendToConnection(id, 'system:ping', { timestamp: now.toISOString() });
        }
      });
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Update last ping time for a connection
   */
  updateLastPing(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastPing = new Date();
    }
  }

  /**
   * Clean up resources
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close all connections
    this.connections.forEach((connection) => {
      connection.socket.close(1001, 'Server shutting down');
    });

    this.connections.clear();
    this.userConnections.clear();
    this.channelSubscriptions.clear();

    console.log('[WS] Connection manager shut down');
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
