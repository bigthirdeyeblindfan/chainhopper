# ChainHopper API Reference

The ChainHopper API provides programmatic access to multi-chain trading functionality.

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.chainhopper.io` |
| Development | `http://localhost:3000` |

## OpenAPI Specification

The complete API specification is available in OpenAPI 3.0 format:

- [openapi.yaml](./openapi.yaml) - OpenAPI specification file
- [Swagger UI](https://api.chainhopper.io/docs) - Interactive documentation (production)

## Authentication

### JWT Tokens (Web/Mobile Apps)

1. Authenticate via Telegram:

```bash
POST /auth/telegram
Content-Type: application/json

{
  "id": 123456789,
  "first_name": "John",
  "username": "johndoe",
  "auth_date": 1704067200,
  "hash": "..."
}
```

2. Use the access token:

```bash
GET /user/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

3. Refresh before expiry:

```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

### API Keys (Bots/Scripts)

1. Create an API key (requires JWT auth first):

```bash
POST /auth/api-keys
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "Trading Bot",
  "permissions": ["read", "trade"]
}
```

2. Use the API key:

```bash
GET /portfolio/balances
Authorization: ApiKey chpr_abc123...
```

## Rate Limits

| Tier | Requests/Minute | WebSocket Connections |
|------|-----------------|----------------------|
| Free | 60 | 2 |
| Holder | 300 | 10 |
| Staker | 1000 | 50 |
| Enterprise | Custom | Custom |

Rate limit headers in responses:
- `X-RateLimit-Limit` - Your rate limit
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Unix timestamp when limit resets

## Common Endpoints

### Get a Quote

```bash
GET /quote?chainId=base&tokenIn=0x...&tokenOut=0x...&amountIn=1000000000000000000

Response:
{
  "id": "quote_abc123",
  "chainId": "base",
  "tokenIn": { "symbol": "ETH", ... },
  "tokenOut": { "symbol": "USDC", ... },
  "amountIn": "1000000000000000000",
  "amountOut": "3250000000",
  "amountOutMin": "3217500000",
  "priceImpact": 0.15,
  "route": [...],
  "fee": {
    "totalFeeUsd": 2.50,
    "protocolFee": "0",
    "networkFee": "1000000000000000"
  },
  "expiresAt": "2025-01-14T12:05:00Z"
}
```

### Execute a Swap

```bash
# 1. Build the transaction
POST /swap/build
Authorization: Bearer ...
Content-Type: application/json

{
  "quoteId": "quote_abc123",
  "recipient": "0x..."
}

# 2. Sign and send the transaction (client-side)

# 3. Submit the transaction hash
POST /swap/submit
Authorization: Bearer ...
Content-Type: application/json

{
  "quoteId": "quote_abc123",
  "txHash": "0x..."
}
```

### Get Portfolio

```bash
GET /portfolio/balances
Authorization: Bearer ...

Response:
{
  "balances": [
    {
      "token": { "symbol": "ETH", "chainId": "base", ... },
      "balance": "1500000000000000000",
      "balanceFormatted": "1.5",
      "valueUsd": 4875.00,
      "priceUsd": 3250.00
    }
  ],
  "totalValueUsd": 4875.00
}
```

### Get P&L Summary

```bash
GET /portfolio/summary
Authorization: Bearer ...

Response:
{
  "totalValueUsd": 10000.00,
  "totalCostBasisUsd": 8500.00,
  "totalUnrealizedPnlUsd": 1500.00,
  "totalUnrealizedPnlPercent": 17.65,
  "totalRealizedPnlUsd": 500.00,
  "totalFeePaidUsd": 75.00,
  "byChain": [
    { "chainId": "base", "valueUsd": 5000.00, "pnlUsd": 750.00, "pnlPercent": 17.65 },
    { "chainId": "ethereum", "valueUsd": 5000.00, "pnlUsd": 750.00, "pnlPercent": 17.65 }
  ]
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

### Common Error Codes

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
| `INSUFFICIENT_BALANCE` | 400 | Not enough tokens |

## WebSocket API

Connect to `wss://api.chainhopper.io/ws` for real-time updates.

### Authentication

```javascript
ws.send(JSON.stringify({
  type: 'auth',
  token: 'Bearer eyJhbGciOiJIUzI1NiIs...'
}));
```

### Subscribe to Price Updates

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'prices',
  tokens: [
    { chainId: 'base', address: '0x...' }
  ]
}));

// Receive updates
{
  "type": "price",
  "chainId": "base",
  "address": "0x...",
  "priceUsd": 3250.00,
  "priceChange24h": 2.5
}
```

### Subscribe to Trade Updates

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'trades'
}));

// Receive updates
{
  "type": "trade",
  "swapId": "swap_123",
  "status": "confirmed",
  "amountOut": "3250000000"
}
```

## SDKs

### TypeScript/JavaScript

```typescript
import { ChainHopperClient } from '@chainhopper/sdk';

const client = new ChainHopperClient({
  apiKey: 'chpr_...'
});

// Get a quote
const quote = await client.getQuote({
  chainId: 'base',
  tokenIn: '0x...',
  tokenOut: '0x...',
  amountIn: '1000000000000000000'
});

// Execute swap
const swap = await client.executeSwap(quote.id);
```

### Python

```python
from chainhopper import ChainHopperClient

client = ChainHopperClient(api_key='chpr_...')

# Get a quote
quote = client.get_quote(
    chain_id='base',
    token_in='0x...',
    token_out='0x...',
    amount_in='1000000000000000000'
)

# Execute swap
swap = client.execute_swap(quote.id)
```

## Changelog

### v0.1.0 (Initial Release)
- REST API for trading, portfolio, and account management
- WebSocket API for real-time updates
- Support for 12 chains
- JWT and API key authentication
