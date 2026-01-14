# Telegram Bot User Guide

The ChainHopper Telegram bot provides a convenient way to trade across multiple blockchains directly from Telegram.

## Getting Started

### 1. Find the Bot

Search for `@ChainHopperBot` on Telegram or click the link provided on our website.

### 2. Start the Bot

Send `/start` to the bot. This will:
- Create your ChainHopper account
- Display the main menu
- Show available commands

### 3. Connect Your Wallet

Use `/wallet` to add your wallet address:
- The bot will prompt you to select a chain
- Enter your wallet address
- Your wallet is now connected (non-custodial - we never have access to your keys)

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and show main menu |
| `/help` | Show all available commands |
| `/chain` | Select the active blockchain |
| `/wallet` | Manage wallet addresses |
| `/balance` | View token balances |
| `/swap` | Execute a token swap |
| `/history` | View trade history |
| `/settings` | Configure bot settings |

## Trading

### Getting a Quote

1. Send `/swap` to start a new trade
2. The bot will ask for:
   - Token to sell (address or symbol)
   - Token to buy (address or symbol)
   - Amount to trade

Example:
```
/swap
Bot: What token do you want to sell?
You: ETH
Bot: What token do you want to buy?
You: USDC
Bot: How much ETH do you want to sell?
You: 0.5
```

### Reviewing the Quote

The bot will display:
- Input amount and token
- Expected output amount
- Price impact
- Network fees
- Platform fees (only on profitable trades)
- Route (which DEXes will be used)

Example quote display:
```
📊 Swap Quote

🔄 Sell: 0.5 ETH ($1,625.00)
📥 Receive: ~1,612.50 USDC
📉 Price Impact: 0.15%

💰 Fees:
  • Network: $2.50
  • Platform: $0.00 (profit-share)

🛣️ Route: Uniswap V3 → USDC

⏱️ Quote expires in 60 seconds

[Confirm] [Cancel]
```

### Confirming the Trade

- Tap **Confirm** to proceed
- You'll be prompted to sign the transaction in your wallet app
- The bot will monitor the transaction and notify you when confirmed

### Trade Confirmation

After confirmation, you'll see:
```
✅ Swap Confirmed!

🔄 Sold: 0.5 ETH
📥 Received: 1,612.75 USDC
💰 Profit: +$0.25 (+0.02%)
📋 Fee: $0.04 (profit-share)

🔗 Transaction: etherscan.io/tx/0x...
```

## Portfolio

### Viewing Balances

Send `/balance` to see your holdings:
```
💼 Portfolio - Base

ETH: 1.5 ($4,875.00)
USDC: 2,500 ($2,500.00)
PEPE: 1,000,000 ($125.00)

Total: $7,500.00

[Refresh] [All Chains]
```

### Viewing History

Send `/history` to see past trades:
```
📜 Trade History

1. ✅ ETH → USDC (Base)
   Sold: 0.5 ETH | Got: 1,612.75 USDC
   Profit: +$0.25 | Fee: $0.04
   2 hours ago

2. ✅ USDC → PEPE (Base)
   Sold: 100 USDC | Got: 800,000 PEPE
   Profit: +$25.00 | Fee: $3.75
   1 day ago

[Load More]
```

## Settings

### Configuring the Bot

Send `/settings` to access:

```
⚙️ Settings

📊 Default Chain: Base
📉 Slippage Tolerance: 0.5%
🔔 Notifications: ON

[Change Chain]
[Change Slippage]
[Toggle Notifications]
```

### Available Settings

| Setting | Options | Description |
|---------|---------|-------------|
| Default Chain | Any supported chain | Chain used by default for swaps |
| Slippage | 0.1% - 50% | Maximum allowed slippage |
| Notifications | On/Off | Trade confirmations, price alerts |
| Auto-Approve | On/Off | Skip confirmation for small trades |

## Referral Program

### Get Your Referral Link

Send `/referral` to see your referral code and link:

```
🔗 Your Referral

Code: TRADER123
Link: t.me/ChainHopperBot?start=TRADER123

📊 Stats:
  • Referrals: 15
  • Their Volume: $25,000
  • Your Earnings: $125.00

Current Tier: Silver (25% share)
Next Tier: Gold at $50K volume (30% share)

[Share Link] [Claim Earnings]
```

### How It Works

1. Share your referral link with friends
2. When they trade, you earn a percentage of their fees
3. They get a discount on their fees
4. Your tier increases with their trading volume

## Supported Chains

Use `/chain` to switch between:

| Chain | Native Token | DEXes |
|-------|-------------|-------|
| Ethereum | ETH | Uniswap, 1inch |
| Base | ETH | Uniswap, Aerodrome |
| Arbitrum | ETH | Uniswap, Camelot |
| Optimism | ETH | Velodrome |
| Polygon | MATIC | QuickSwap |
| BSC | BNB | PancakeSwap |
| Avalanche | AVAX | Trader Joe |
| TON | TON | STONfi, DeDust |

## Tips & Best Practices

### For Best Execution

1. **Check price impact** - High impact means worse price
2. **Use appropriate slippage** - 0.5% for stable pairs, 1-3% for volatile
3. **Trade during low gas** - Check gas prices before large trades
4. **Split large orders** - Better execution for big trades

### Security

1. **Never share your seed phrase** - The bot never asks for it
2. **Verify transactions** - Always review before signing
3. **Use hardware wallets** - For large holdings
4. **Enable notifications** - Get alerts for all trades

### Saving Gas

1. **Batch transactions** - Combine approvals when possible
2. **Use L2 chains** - Base, Arbitrum, Optimism are cheaper
3. **Trade during off-peak** - Weekends and late nights are cheaper

## Troubleshooting

### "Quote expired"

Quotes are valid for 60 seconds. Request a new quote and confirm quickly.

### "Insufficient balance"

Make sure you have:
- Enough tokens to trade
- Enough native token (ETH, BNB, etc.) for gas

### "Transaction failed"

Common causes:
- Slippage too low - increase slippage tolerance
- Gas price spiked - try again later
- Token has transfer tax - increase slippage

### "Chain unavailable"

The chain may be temporarily down. Try again in a few minutes or use a different chain.

## Getting Help

- Send `/help` for command list
- Join our Telegram support group
- Check our FAQ at chainhopper.io/faq
- Email support@chainhopper.io

## Privacy

- We only store your Telegram ID and wallet addresses
- We never have access to your private keys
- Trade data is stored for P&L tracking
- You can delete your data anytime with `/delete_account`
