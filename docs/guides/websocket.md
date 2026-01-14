# WebSocket API Guide

Real-time data streaming for price updates, trade notifications, and portfolio changes.

## Connection

### Endpoint

```
Production: wss://api.chainhopper.io/ws
Development: ws://localhost:3000/ws
```

### Basic Connection (JavaScript)

```javascript
const ws = new WebSocket('wss://api.chainhopper.io/ws');

ws.onopen = () => {
  console.log('Connected to ChainHopper WebSocket');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

## Authentication

Authenticate immediately after connecting to access user-specific channels.

### Send Auth Message

```javascript
ws.send(JSON.stringify({
  type: 'auth',
  token: 'Bearer eyJhbGciOiJIUzI1NiIs...'
}));
```

### Or use API Key

```javascript
ws.send(JSON.stringify({
  type: 'auth',
  apiKey: 'chpr_your_api_key_here'
}));
```

### Auth Response

```json
{
  "type": "auth_success",
  "userId": "user_abc123"
}
```

Or on failure:

```json
{
  "type": "auth_error",
  "error": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

## Channels

### Price Updates

Subscribe to real-time price updates for specific tokens.

#### Subscribe

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'prices',
  tokens: [
    { chainId: 'base', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
    { chainId: 'ethereum', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
  ]
}));
```

#### Receive Updates

```json
{
  "type": "price",
  "chainId": "base",
  "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "symbol": "USDC",
  "priceUsd": 1.0001,
  "priceChange24h": 0.01,
  "volume24h": 1500000000,
  "timestamp": 1704067200000
}
```

#### Unsubscribe

```javascript
ws.send(JSON.stringify({
  type: 'unsubscribe',
  channel: 'prices',
  tokens: [
    { chainId: 'base', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }
  ]
}));
```

### Trade Updates

Subscribe to updates for your trades. **Requires authentication.**

#### Subscribe

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'trades'
}));
```

#### Receive Updates

```json
{
  "type": "trade",
  "swapId": "swap_abc123",
  "quoteId": "quote_xyz789",
  "status": "confirmed",
  "chainId": "base",
  "tokenIn": {
    "symbol": "ETH",
    "address": "0x...",
    "amount": "1000000000000000000"
  },
  "tokenOut": {
    "symbol": "USDC",
    "address": "0x...",
    "amount": "3250000000"
  },
  "txHash": "0x...",
  "confirmedAt": "2025-01-14T12:00:00Z"
}
```

#### Trade Status Values

| Status | Description |
|--------|-------------|
| `pending` | Quote accepted, awaiting transaction |
| `submitted` | Transaction submitted to network |
| `confirming` | Transaction seen, awaiting confirmations |
| `confirmed` | Transaction confirmed successfully |
| `failed` | Transaction failed |
| `expired` | Quote expired before execution |

### Portfolio Updates

Real-time portfolio value and balance changes. **Requires authentication.**

#### Subscribe

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'portfolio'
}));
```

#### Receive Updates

```json
{
  "type": "portfolio",
  "totalValueUsd": 10500.00,
  "change24h": 250.00,
  "changePercent24h": 2.44,
  "balances": [
    {
      "chainId": "base",
      "token": "ETH",
      "balance": "1.5",
      "valueUsd": 4875.00
    },
    {
      "chainId": "base",
      "token": "USDC",
      "balance": "5625.00",
      "valueUsd": 5625.00
    }
  ],
  "timestamp": 1704067200000
}
```

### Price Alerts

Get notified when tokens hit price targets. **Requires authentication.**

#### Subscribe

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'alerts'
}));
```

#### Receive Alerts

```json
{
  "type": "alert",
  "alertId": "alert_123",
  "chainId": "base",
  "token": {
    "symbol": "ETH",
    "address": "0x..."
  },
  "condition": "above",
  "targetPrice": 3500.00,
  "currentPrice": 3501.25,
  "triggeredAt": "2025-01-14T12:00:00Z"
}
```

## Message Types

### Client to Server

| Type | Description | Auth Required |
|------|-------------|---------------|
| `auth` | Authenticate connection | No |
| `subscribe` | Subscribe to channel | Depends on channel |
| `unsubscribe` | Unsubscribe from channel | No |
| `ping` | Keep-alive ping | No |

### Server to Client

| Type | Description |
|------|-------------|
| `auth_success` | Authentication successful |
| `auth_error` | Authentication failed |
| `subscribed` | Subscription confirmed |
| `unsubscribed` | Unsubscription confirmed |
| `price` | Price update |
| `trade` | Trade status update |
| `portfolio` | Portfolio update |
| `alert` | Price alert triggered |
| `error` | Error message |
| `pong` | Response to ping |

## Keep-Alive

Send periodic pings to keep the connection alive:

```javascript
// Send ping every 30 seconds
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

Response:

```json
{
  "type": "pong",
  "timestamp": 1704067200000
}
```

## Error Handling

### Error Message Format

```json
{
  "type": "error",
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "retryAfter": 60
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_TOKEN` | Authentication token is invalid |
| `TOKEN_EXPIRED` | Authentication token has expired |
| `RATE_LIMITED` | Too many messages |
| `INVALID_MESSAGE` | Malformed message |
| `INVALID_CHANNEL` | Unknown channel |
| `AUTH_REQUIRED` | Channel requires authentication |
| `SUBSCRIPTION_LIMIT` | Too many subscriptions |

## Rate Limits

| Tier | Connections | Messages/min | Subscriptions |
|------|-------------|--------------|---------------|
| Free | 2 | 60 | 10 |
| Holder | 10 | 300 | 100 |
| Staker | 50 | 1000 | 500 |
| Enterprise | Custom | Custom | Custom |

## Reconnection

Implement automatic reconnection with exponential backoff:

```javascript
class ChainHopperWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.token = options.token;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.subscriptions = [];
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected');
      this.reconnectDelay = 1000; // Reset delay

      // Re-authenticate
      if (this.token) {
        this.send({ type: 'auth', token: this.token });
      }

      // Re-subscribe to channels
      for (const sub of this.subscriptions) {
        this.send(sub);
      }
    };

    this.ws.onclose = () => {
      console.log(`Disconnected. Reconnecting in ${this.reconnectDelay}ms`);
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(channel, options = {}) {
    const sub = { type: 'subscribe', channel, ...options };
    this.subscriptions.push(sub);
    this.send(sub);
  }

  handleMessage(message) {
    // Handle different message types
    switch (message.type) {
      case 'price':
        this.onPrice?.(message);
        break;
      case 'trade':
        this.onTrade?.(message);
        break;
      case 'portfolio':
        this.onPortfolio?.(message);
        break;
      case 'error':
        this.onError?.(message);
        break;
    }
  }
}

// Usage
const ws = new ChainHopperWebSocket('wss://api.chainhopper.io/ws', {
  token: 'Bearer eyJhbG...'
});

ws.onPrice = (data) => console.log('Price:', data);
ws.onTrade = (data) => console.log('Trade:', data);

ws.subscribe('prices', {
  tokens: [{ chainId: 'base', address: '0x...' }]
});
ws.subscribe('trades');
```

## Complete Example

```javascript
// Full WebSocket client example

const WS_URL = 'wss://api.chainhopper.io/ws';
const ACCESS_TOKEN = 'Bearer eyJhbG...';

const ws = new WebSocket(WS_URL);
let authenticated = false;

ws.onopen = () => {
  console.log('Connected to ChainHopper');

  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: ACCESS_TOKEN
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'auth_success':
      console.log('Authenticated as:', message.userId);
      authenticated = true;

      // Subscribe to channels after auth
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'prices',
        tokens: [
          { chainId: 'base', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }
        ]
      }));

      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'trades'
      }));

      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'portfolio'
      }));
      break;

    case 'price':
      console.log(`Price Update: ${message.symbol} = $${message.priceUsd}`);
      break;

    case 'trade':
      console.log(`Trade ${message.swapId}: ${message.status}`);
      if (message.status === 'confirmed') {
        console.log(`  Received: ${message.tokenOut.amount} ${message.tokenOut.symbol}`);
      }
      break;

    case 'portfolio':
      console.log(`Portfolio: $${message.totalValueUsd} (${message.changePercent24h}%)`);
      break;

    case 'error':
      console.error(`Error: ${message.error} (${message.code})`);
      break;

    default:
      console.log('Message:', message);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
  // Implement reconnection logic here
};

// Keep-alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

## See Also

- [API Reference](../api/README.md) - REST API documentation
- [SDK Documentation](../SDK.md) - TypeScript and Python SDKs
- [Getting Started](./getting-started.md) - Development setup
