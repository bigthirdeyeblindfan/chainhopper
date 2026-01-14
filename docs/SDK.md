# ChainHopper SDK

Official SDKs for integrating ChainHopper into your applications.

## TypeScript/JavaScript SDK

### Installation

```bash
npm install @chainhopper/sdk
# or
pnpm add @chainhopper/sdk
# or
yarn add @chainhopper/sdk
```

### Quick Start

```typescript
import { ChainHopperClient } from '@chainhopper/sdk';

// Initialize with API key
const client = new ChainHopperClient({
  apiKey: 'chpr_your_api_key_here',
  // Optional: specify environment
  baseUrl: 'https://api.chainhopper.io', // default
});

// Or initialize with JWT token
const clientWithJwt = new ChainHopperClient({
  accessToken: 'eyJhbG...',
  refreshToken: 'eyJhbG...',
});
```

### Authentication

#### API Key Authentication

Best for server-side applications, bots, and scripts.

```typescript
const client = new ChainHopperClient({
  apiKey: 'chpr_your_api_key_here',
});
```

#### JWT Authentication

Best for web/mobile apps with user sessions.

```typescript
import { ChainHopperClient, authenticateTelegram } from '@chainhopper/sdk';

// Authenticate via Telegram
const auth = await authenticateTelegram({
  id: 123456789,
  first_name: 'John',
  auth_date: Math.floor(Date.now() / 1000),
  hash: '...',
});

const client = new ChainHopperClient({
  accessToken: auth.accessToken,
  refreshToken: auth.refreshToken,
  onTokenRefresh: (tokens) => {
    // Store new tokens
    localStorage.setItem('tokens', JSON.stringify(tokens));
  },
});
```

### Trading

#### Get a Quote

```typescript
const quote = await client.getQuote({
  chainId: 'base',
  tokenIn: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
  tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  amountIn: '1000000000000000000', // 1 ETH in wei
  slippage: '0.5', // 0.5%
});

console.log(`
  Input: ${quote.amountIn} ${quote.tokenIn.symbol}
  Output: ${quote.amountOut} ${quote.tokenOut.symbol}
  Price Impact: ${quote.priceImpact}%
  Fee: $${quote.fee.totalFeeUsd}
`);
```

#### Build and Execute Swap

```typescript
// 1. Build the transaction
const txData = await client.buildSwap({
  quoteId: quote.id,
  recipient: '0xYourWalletAddress',
});

// 2. Sign and send with your wallet (ethers.js example)
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const tx = await signer.sendTransaction({
  to: txData.to,
  data: txData.data,
  value: txData.value,
  gasLimit: txData.gasLimit,
});

// 3. Submit the transaction hash
const swap = await client.submitSwap({
  quoteId: quote.id,
  txHash: tx.hash,
});

// 4. Wait for confirmation
const result = await client.waitForSwap(swap.id, {
  timeout: 60000, // 60 seconds
  onStatusChange: (status) => {
    console.log(`Swap status: ${status}`);
  },
});

console.log(`Swap confirmed! Received: ${result.amountOut}`);
```

#### Get Swap Status

```typescript
const swap = await client.getSwap('swap_abc123');
console.log(`Status: ${swap.status}`);
// 'pending' | 'submitted' | 'confirming' | 'confirmed' | 'failed' | 'expired'
```

#### List Swaps

```typescript
const history = await client.listSwaps({
  chainId: 'base', // optional filter
  status: 'confirmed', // optional filter
  limit: 10,
  offset: 0,
});

for (const swap of history.swaps) {
  console.log(`${swap.tokenIn.symbol} -> ${swap.tokenOut.symbol}: ${swap.status}`);
}
```

### Portfolio

#### Get Balances

```typescript
const balances = await client.getBalances({
  chainId: 'base', // optional: filter by chain
});

console.log(`Total Value: $${balances.totalValueUsd}`);

for (const balance of balances.balances) {
  console.log(`
    ${balance.token.symbol}: ${balance.balanceFormatted}
    Value: $${balance.valueUsd}
    24h Change: ${balance.priceChange24h}%
  `);
}
```

#### Get Portfolio Summary

```typescript
const summary = await client.getPortfolioSummary();

console.log(`
  Total Value: $${summary.totalValueUsd}
  Unrealized P&L: $${summary.totalUnrealizedPnlUsd} (${summary.totalUnrealizedPnlPercent}%)
  Realized P&L: $${summary.totalRealizedPnlUsd}
  Total Fees Paid: $${summary.totalFeePaidUsd}
`);

// By chain breakdown
for (const chain of summary.byChain) {
  console.log(`${chain.chainId}: $${chain.valueUsd} (${chain.pnlPercent}%)`);
}
```

#### Get Trade History

```typescript
const history = await client.getHistory({
  chainId: 'base',
  limit: 20,
});

for (const trade of history.trades) {
  const pnl = trade.profit ? `P&L: $${trade.profit}` : '';
  console.log(`
    ${trade.type.toUpperCase()}: ${trade.tokenIn.symbol} -> ${trade.tokenOut.symbol}
    ${trade.tokenIn.amount} -> ${trade.tokenOut.amount}
    ${pnl}
  `);
}
```

### User Management

#### Get Profile

```typescript
const profile = await client.getProfile();

console.log(`
  User ID: ${profile.id}
  Tier: ${profile.tier}
  Referral Code: ${profile.referralCode}
`);
```

#### Update Settings

```typescript
await client.updateSettings({
  defaultSlippage: 0.5,
  defaultChain: 'base',
  notifications: {
    tradeConfirmations: true,
    priceAlerts: false,
  },
});
```

#### Manage Wallets

```typescript
// Add a wallet
const wallet = await client.addWallet({
  chainId: 'base',
  address: '0x...',
  label: 'Main Wallet',
});

// List wallets
const wallets = await client.getWallets();

// Get wallets for specific chain
const baseWallets = await client.getWallets({ chainId: 'base' });
```

### Referrals

```typescript
const referrals = await client.getReferralStats();

console.log(`
  Your Code: ${referrals.code}
  Tier: ${referrals.currentTier}
  Total Referrals: ${referrals.totalReferrals}
  Total Earnings: $${referrals.totalEarningsUsd}
  Pending: $${referrals.pendingEarningsUsd}
`);
```

### Token Search

```typescript
// Search tokens
const tokens = await client.searchTokens({
  chainId: 'base',
  query: 'USDC',
  verified: true,
});

// Get token details
const token = await client.getToken('base', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');

console.log(`
  ${token.name} (${token.symbol})
  Price: $${token.priceUsd}
  24h Change: ${token.priceChange24h}%
  Market Cap: $${token.marketCap}
  Rug Score: ${token.rugScore ?? 'N/A'}
`);
```

### WebSocket (Real-time Updates)

```typescript
import { ChainHopperWebSocket } from '@chainhopper/sdk';

const ws = new ChainHopperWebSocket({
  accessToken: 'eyJhbG...',
});

// Subscribe to price updates
ws.subscribePrices([
  { chainId: 'base', address: '0x...' },
  { chainId: 'ethereum', address: '0x...' },
]);

ws.on('price', (data) => {
  console.log(`${data.chainId}:${data.address} = $${data.priceUsd}`);
});

// Subscribe to your trades
ws.subscribeTrades();

ws.on('trade', (data) => {
  console.log(`Swap ${data.swapId}: ${data.status}`);
});

// Subscribe to portfolio updates
ws.subscribePortfolio();

ws.on('portfolio', (data) => {
  console.log(`Portfolio updated: $${data.totalValueUsd}`);
});

// Clean up
ws.close();
```

### Error Handling

```typescript
import { ChainHopperError, QuoteExpiredError, InsufficientBalanceError } from '@chainhopper/sdk';

try {
  const swap = await client.submitSwap({ quoteId: 'expired_quote', txHash: '0x...' });
} catch (error) {
  if (error instanceof QuoteExpiredError) {
    console.log('Quote expired, fetching new quote...');
    const newQuote = await client.getQuote({ ... });
  } else if (error instanceof InsufficientBalanceError) {
    console.log('Not enough balance');
  } else if (error instanceof ChainHopperError) {
    console.log(`API Error: ${error.message} (${error.code})`);
  } else {
    throw error;
  }
}
```

### TypeScript Types

The SDK exports all TypeScript types:

```typescript
import type {
  ChainId,
  QuoteRequest,
  QuoteResponse,
  SwapResponse,
  BalanceResponse,
  PortfolioSummary,
  UserProfile,
  TokenInfo,
} from '@chainhopper/sdk';
```

---

## Python SDK

### Installation

```bash
pip install chainhopper
```

### Quick Start

```python
from chainhopper import ChainHopperClient

# Initialize with API key
client = ChainHopperClient(api_key='chpr_your_api_key_here')

# Or with JWT tokens
client = ChainHopperClient(
    access_token='eyJhbG...',
    refresh_token='eyJhbG...'
)
```

### Trading

```python
# Get a quote
quote = client.get_quote(
    chain_id='base',
    token_in='0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    token_out='0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount_in='1000000000000000000',
    slippage='0.5'
)

print(f"Output: {quote.amount_out} {quote.token_out.symbol}")
print(f"Price Impact: {quote.price_impact}%")

# Build swap transaction
tx_data = client.build_swap(
    quote_id=quote.id,
    recipient='0xYourWalletAddress'
)

# Sign and send transaction with web3.py
from web3 import Web3

w3 = Web3(Web3.HTTPProvider('https://...'))
tx = {
    'to': tx_data.to,
    'data': tx_data.data,
    'value': int(tx_data.value),
    'gas': int(tx_data.gas_limit),
}
signed = w3.eth.account.sign_transaction(tx, private_key)
tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)

# Submit to ChainHopper
swap = client.submit_swap(quote_id=quote.id, tx_hash=tx_hash.hex())
print(f"Swap submitted: {swap.id}")
```

### Portfolio

```python
# Get balances
balances = client.get_balances(chain_id='base')
print(f"Total Value: ${balances.total_value_usd}")

for b in balances.balances:
    print(f"{b.token.symbol}: {b.balance_formatted} (${b.value_usd})")

# Get P&L summary
summary = client.get_portfolio_summary()
print(f"Unrealized P&L: ${summary.total_unrealized_pnl_usd}")
```

### Async Support

```python
import asyncio
from chainhopper import AsyncChainHopperClient

async def main():
    client = AsyncChainHopperClient(api_key='chpr_...')

    # All methods are async
    quote = await client.get_quote(...)
    balances = await client.get_balances()

    await client.close()

asyncio.run(main())
```

### Error Handling

```python
from chainhopper import ChainHopperError, QuoteExpiredError

try:
    swap = client.submit_swap(quote_id='expired', tx_hash='0x...')
except QuoteExpiredError:
    print("Quote expired, fetching new one...")
    quote = client.get_quote(...)
except ChainHopperError as e:
    print(f"API Error: {e.message} ({e.code})")
```

---

## Supported Chains

Both SDKs support these chain identifiers:

| Chain ID | Network |
|----------|---------|
| `ethereum` | Ethereum Mainnet |
| `base` | Base |
| `arbitrum` | Arbitrum One |
| `optimism` | Optimism |
| `polygon` | Polygon |
| `bsc` | BNB Smart Chain |
| `avalanche` | Avalanche C-Chain |
| `sonic` | Sonic |
| `kaia` | Kaia |
| `berachain` | Berachain |
| `ton` | TON |
| `sui` | Sui |

---

## Rate Limits

SDK requests count against your API rate limits:

| Tier | Requests/Minute |
|------|-----------------|
| Free | 60 |
| Holder | 300 |
| Staker | 1000 |
| Enterprise | Custom |

The SDK automatically handles rate limit responses with exponential backoff.

---

## Support

- **Documentation:** https://docs.chainhopper.io
- **GitHub Issues:** https://github.com/chainhopper/sdk-js/issues
- **Discord:** https://discord.gg/chainhopper
