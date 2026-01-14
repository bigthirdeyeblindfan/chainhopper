# ChainHopper API Reference

Complete API reference for the ChainHopper multi-chain trading platform.

## Base URL

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:3000` |
| Production | `https://api.chainhopper.io` |

## Authentication

ChainHopper supports two authentication methods:

### JWT Tokens (Web/Mobile)

```bash
# 1. Authenticate via Telegram
POST /auth/telegram
{
  "id": 123456789,
  "first_name": "John",
  "auth_date": 1704067200,
  "hash": "..."
}

# Response
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}

# 2. Use token in requests
Authorization: Bearer eyJhbG...

# 3. Refresh before expiry
POST /auth/refresh
{ "refreshToken": "eyJhbG..." }
```

### API Keys (Bots/Scripts)

```bash
# 1. Create API key (requires JWT auth)
POST /auth/api-keys
{
  "name": "Trading Bot",
  "permissions": ["read", "trade"]
}

# Response (key only shown once!)
{
  "id": "key_xxx",
  "key": "chpr_abc123...",
  "keyPrefix": "chpr_abc1",
  "permissions": ["read", "trade"]
}

# 2. Use in requests
Authorization: ApiKey chpr_abc123...
```

### Permissions

| Permission | Access |
|------------|--------|
| `read` | Portfolio, balances, trade history |
| `trade` | Execute swaps, get quotes |
| `withdraw` | Withdraw funds (future) |

## Rate Limits

| Tier | Requests/min | WebSocket Connections |
|------|--------------|----------------------|
| Free | 60 | 2 |
| Holder | 300 | 10 |
| Staker | 1000 | 50 |
| Enterprise | Custom | Custom |

Rate limit headers included in responses:
- `X-RateLimit-Limit` - Your limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp (Unix)

## Endpoints

### System

#### Health Check
```
GET /health
```

Returns API health and chain connectivity.

**Response:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "uptime": 86400,
  "chains": [
    { "chainId": "base", "status": "up", "latency": 45 },
    { "chainId": "ton", "status": "up", "latency": 120 }
  ]
}
```

#### Readiness Check
```
GET /ready
```
Returns 200 if service is ready for traffic, 503 otherwise.

#### Liveness Check
```
GET /live
```
Returns 200 if service is alive.

---

### Trading

#### Get Quote
```
GET /quote?chainId={chainId}&tokenIn={address}&tokenOut={address}&amountIn={amount}&slippage={percent}
```

Get a swap quote. No authentication required.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| chainId | string | Yes | Chain ID (e.g., `base`, `ton`) |
| tokenIn | string | Yes | Input token address |
| tokenOut | string | Yes | Output token address |
| amountIn | string | Yes | Amount in smallest unit |
| slippage | string | No | Slippage tolerance % (default: 0.5) |

**Response:**
```json
{
  "id": "quote_abc123",
  "chainId": "base",
  "tokenIn": {
    "address": "0x...",
    "symbol": "ETH",
    "decimals": 18
  },
  "tokenOut": {
    "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "symbol": "USDC",
    "decimals": 6
  },
  "amountIn": "1000000000000000000",
  "amountOut": "3250000000",
  "amountOutMin": "3217500000",
  "priceImpact": 0.15,
  "route": [
    {
      "dex": "uniswap_v3",
      "poolAddress": "0x...",
      "tokenIn": "0x...",
      "tokenOut": "0x...",
      "percentage": 100
    }
  ],
  "fee": {
    "totalFeeUsd": 2.50,
    "protocolFee": "0",
    "protocolFeeUsd": 0,
    "networkFee": "1000000000000000",
    "networkFeeUsd": 2.50
  },
  "expiresAt": "2025-01-14T12:00:00Z",
  "dexAggregator": "1inch"
}
```

#### Build Swap Transaction
```
POST /swap/build
Authorization: Bearer {token}
```

Build a transaction from a quote.

**Request:**
```json
{
  "quoteId": "quote_abc123",
  "recipient": "0x...",
  "deadline": 1704067200
}
```

**Response:**
```json
{
  "quoteId": "quote_abc123",
  "chainId": "base",
  "to": "0x...",
  "data": "0x...",
  "value": "1000000000000000000",
  "gasLimit": "150000",
  "expiresAt": "2025-01-14T12:00:00Z"
}
```

#### Submit Swap
```
POST /swap/submit
Authorization: Bearer {token}
```

Record a submitted transaction for tracking.

**Request:**
```json
{
  "quoteId": "quote_abc123",
  "txHash": "0x..."
}
```

#### Get Swap Status
```
GET /swap/{swapId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "swap_xyz",
  "quoteId": "quote_abc123",
  "status": "confirmed",
  "txHash": "0x...",
  "chainId": "base",
  "amountIn": "1000000000000000000",
  "amountOut": "3248000000",
  "fee": { ... },
  "executedAt": "2025-01-14T11:55:00Z",
  "confirmedAt": "2025-01-14T11:55:30Z"
}
```

**Swap Status Values:**
- `pending` - Waiting for submission
- `submitted` - Transaction submitted
- `confirming` - Waiting for confirmations
- `confirmed` - Successfully completed
- `failed` - Transaction failed
- `expired` - Quote expired

#### List Swaps
```
GET /swaps?chainId={chainId}&status={status}&limit={n}&offset={n}
Authorization: Bearer {token}
```

#### Search Tokens
```
GET /tokens?chainId={chainId}&query={search}&verified={bool}&limit={n}
```

#### Get Token Details
```
GET /tokens/{chainId}/{address}
```

**Response includes:**
- Token metadata (symbol, name, decimals)
- Price information (USD price, 24h change)
- Market data (volume, market cap)
- Safety score (rug pull detection)

---

### Portfolio

#### Get Balances
```
GET /portfolio/balances?chainId={chainId}&includeZero={bool}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "balances": [
    {
      "token": { "address": "0x...", "symbol": "USDC", ... },
      "balance": "1000000000",
      "balanceFormatted": "1,000.00",
      "valueUsd": 1000.00,
      "priceUsd": 1.00,
      "priceChange24h": 0.01
    }
  ],
  "totalValueUsd": 5000.00
}
```

#### Get Positions
```
GET /portfolio/positions?chainId={chainId}&status={open|closed|all}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "positions": [
    {
      "id": "pos_123",
      "chainId": "base",
      "token": { ... },
      "amount": "1000000000000000000",
      "entryPrice": 3200.00,
      "currentPrice": 3350.00,
      "costBasis": 3200.00,
      "currentValue": 3350.00,
      "unrealizedPnl": 150.00,
      "unrealizedPnlPercent": 4.69,
      "isOpen": true,
      "openedAt": "2025-01-10T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### Get Portfolio Summary
```
GET /portfolio/summary
Authorization: Bearer {token}
```

**Response:**
```json
{
  "totalValueUsd": 10000.00,
  "totalCostBasisUsd": 8500.00,
  "totalUnrealizedPnlUsd": 1500.00,
  "totalUnrealizedPnlPercent": 17.65,
  "totalRealizedPnlUsd": 500.00,
  "totalFeePaidUsd": 75.00,
  "byChain": [
    {
      "chainId": "base",
      "valueUsd": 6000.00,
      "pnlUsd": 1000.00,
      "pnlPercent": 20.00
    },
    {
      "chainId": "ton",
      "valueUsd": 4000.00,
      "pnlUsd": 500.00,
      "pnlPercent": 14.29
    }
  ]
}
```

#### Get P&L Chart Data
```
GET /portfolio/pnl-chart?period={1d|7d|30d|90d|1y|all}
Authorization: Bearer {token}
```

---

### Account

#### Get Current User
```
GET /user/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "user_123",
  "telegramId": "123456789",
  "telegramUsername": "johndoe",
  "tier": "HOLDER",
  "referralCode": "CHABCDEF",
  "settings": {
    "defaultSlippage": 0.5,
    "defaultChain": "base",
    "notifications": {
      "tradeConfirmations": true,
      "priceAlerts": true
    }
  },
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Update Settings
```
PATCH /user/settings
Authorization: Bearer {token}
```

**Request:**
```json
{
  "defaultSlippage": 1.0,
  "defaultChain": "ton",
  "notifications": {
    "tradeConfirmations": false
  }
}
```

#### Manage Wallets
```
GET /user/wallets
POST /user/wallets
PATCH /user/wallets/{walletId}
DELETE /user/wallets/{walletId}
```

#### Referral System
```
GET /user/referrals      # Get referral stats
GET /user/referral-link  # Get referral links
GET /user/points         # Get points balance
GET /user/tier           # Get tier information
```

---

## WebSocket API

Connect to `ws://localhost:3000/ws` (or `wss://api.chainhopper.io/ws` in production).

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'Bearer eyJhbG...'
  }));
};
```

### Subscribe to Channels

```javascript
// Subscribe to price updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'prices',
  params: { chainId: 'base', tokens: ['0x...'] }
}));

// Subscribe to trade updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'trades'
}));

// Subscribe to portfolio updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'portfolio'
}));
```

### Event Types

#### Price Update
```json
{
  "type": "price_update",
  "data": {
    "chainId": "base",
    "tokenAddress": "0x...",
    "priceUsd": 3250.00,
    "change24h": 2.5,
    "volume24h": 1000000,
    "timestamp": "2025-01-14T12:00:00Z"
  }
}
```

#### Trade Event
```json
{
  "type": "trade_event",
  "data": {
    "swapId": "swap_xyz",
    "status": "confirmed",
    "txHash": "0x...",
    "amountOut": "3248000000"
  }
}
```

#### Portfolio Update
```json
{
  "type": "portfolio_update",
  "data": {
    "totalValueUsd": 10150.00,
    "change24h": 150.00,
    "changePercent24h": 1.5
  }
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | No authentication provided |
| `INVALID_TOKEN` | 401 | Token is invalid or expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `RATE_LIMITED` | 429 | Too many requests |
| `INVALID_PARAMS` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `CHAIN_UNAVAILABLE` | 503 | Chain is temporarily unavailable |
| `QUOTE_EXPIRED` | 400 | Quote has expired |
| `INSUFFICIENT_BALANCE` | 400 | Insufficient token balance |

---

## Supported Chains

| Chain ID | Name | Native Token | DEX Aggregator |
|----------|------|--------------|----------------|
| `ton` | TON | TON | STONfi, DeDust |
| `ethereum` | Ethereum | ETH | 1inch, ParaSwap |
| `base` | Base | ETH | 1inch, ParaSwap |
| `arbitrum` | Arbitrum | ETH | 1inch, ParaSwap |
| `optimism` | Optimism | ETH | 1inch, ParaSwap |
| `polygon` | Polygon | MATIC | 1inch, ParaSwap |
| `bsc` | BNB Chain | BNB | 1inch, ParaSwap |
| `avalanche` | Avalanche | AVAX | 1inch, ParaSwap |
| `sonic` | Sonic | S | Native |
| `kaia` | Kaia | KAIA | Native |
| `berachain` | Berachain | BERA | Native |
| `sui` | Sui | SUI | Cetus, Turbos |
| `eclipse` | Eclipse | ETH | Native |
| `hyperliquid` | Hyperliquid | USDC | Native |

---

## Code Examples

### TypeScript/JavaScript

```typescript
import { ApiClient } from '@chainhopper/client';

const client = new ApiClient({
  baseUrl: 'https://api.chainhopper.io',
  apiKey: 'chpr_xxx'
});

// Get quote
const quote = await client.getQuote({
  chainId: 'base',
  tokenIn: '0x...',
  tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  amountIn: '1000000000000000000'
});

// Build and submit swap
const tx = await client.buildSwap({
  quoteId: quote.id,
  recipient: '0x...'
});

// Sign and submit tx...
const swap = await client.submitSwap({
  quoteId: quote.id,
  txHash: '0x...'
});
```

### Python

```python
import requests

API_BASE = "https://api.chainhopper.io"
API_KEY = "chpr_xxx"

headers = {"Authorization": f"ApiKey {API_KEY}"}

# Get quote
quote = requests.get(
    f"{API_BASE}/quote",
    params={
        "chainId": "base",
        "tokenIn": "0x...",
        "tokenOut": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "amountIn": "1000000000000000000"
    }
).json()

# Get portfolio
portfolio = requests.get(
    f"{API_BASE}/portfolio/summary",
    headers=headers
).json()
```

### cURL

```bash
# Get quote (no auth required)
curl "https://api.chainhopper.io/quote?chainId=base&tokenIn=0x...&tokenOut=0x...&amountIn=1000000000000000000"

# Get portfolio (with API key)
curl -H "Authorization: ApiKey chpr_xxx" \
     "https://api.chainhopper.io/portfolio/summary"
```
