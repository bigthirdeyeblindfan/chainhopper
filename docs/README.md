# ChainHopper Documentation

Welcome to the ChainHopper documentation. ChainHopper is a multi-chain trading bot with a unique profit-share fee model.

## Quick Links

### For Users
- [Telegram Bot Guide](./guides/telegram-bot.md) - User guide for the Telegram bot

### For Developers
- [Getting Started](./guides/getting-started.md) - Developer setup guide
- [API Reference](./api/README.md) - REST API documentation
- [WebSocket Guide](./guides/websocket.md) - Real-time data streaming
- [SDK Documentation](./SDK.md) - TypeScript and Python SDKs
- [Smart Contracts](./contracts/README.md) - Solidity contract documentation

### Additional Resources
- [Full API Docs](./API.md) - Comprehensive API reference
- [Developer Guide](./DEVELOPER_GUIDE.md) - In-depth development guide
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Contributing](../CONTRIBUTING.md) - How to contribute
- [Changelog](../CHANGELOG.md) - Version history

## Overview

ChainHopper enables trading across 15+ blockchain networks with a fair fee model: **you only pay when you profit**.

### Supported Chains

| Chain | Type | DEX Aggregators |
|-------|------|-----------------|
| Ethereum | EVM | 1inch, ParaSwap |
| Base | EVM | 1inch, ParaSwap |
| Arbitrum | EVM | 1inch, ParaSwap |
| Optimism | EVM | 1inch, ParaSwap |
| Polygon | EVM | 1inch, ParaSwap |
| BSC | EVM | 1inch, ParaSwap |
| Avalanche | EVM | 1inch, ParaSwap |
| Sonic | EVM | 1inch |
| Berachain | EVM | 1inch |
| TON | TON | STONfi, DeDust |
| Sui | Move | Cetus, Turbos |
| Eclipse | SVM | Jupiter |

### Fee Model

| Tier | Profit Share | Requirement |
|------|--------------|-------------|
| Free | 15% | None |
| Holder | 10% | 1,000 $HOPPER |
| Staker | 5% | 10,000 veHOPPER |
| Enterprise | 2-5% | Custom agreement |

### Referral Program

Earn rewards by referring traders:

| Referral Tier | Weekly Volume | Your Share | Referee Discount |
|---------------|---------------|------------|------------------|
| Bronze | < $10K | 20% | 5% |
| Silver | $10K - $50K | 25% | 7.5% |
| Gold | $50K - $200K | 30% | 10% |
| Diamond | > $200K | 35% | 10% |

## Architecture

```
                                   ┌─────────────────┐
                                   │   Telegram Bot  │
                                   │   (Grammy)      │
                                   └────────┬────────┘
                                            │
┌─────────────────┐                         │
│    Web Panel    │                         │
│    (Next.js)    │                         │
└────────┬────────┘                         │
         │                                  │
         └──────────────┬───────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │    REST API     │◄──── WebSocket
              │    (Hono)       │      Server
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │   EVM    │  │   TON    │  │   SUI    │
   │ Adapter  │  │ Adapter  │  │ Adapter  │
   └────┬─────┘  └────┬─────┘  └────┬─────┘
        │             │             │
        ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ 1inch /  │  │ STONfi / │  │ Cetus /  │
   │ ParaSwap │  │ DeDust   │  │ Turbos   │
   └──────────┘  └──────────┘  └──────────┘
```

## Project Structure

```
chainhopper/
├── apps/
│   ├── api/            # REST API (Hono)
│   ├── bot/            # Telegram Bot (Grammy)
│   └── web/            # Web Panel (Next.js)
├── packages/
│   ├── adapters/       # Chain adapters (EVM, TON, Sui)
│   ├── contracts/      # Smart contracts (Solidity, FunC)
│   ├── core/           # Shared business logic
│   └── types/          # Shared TypeScript types
└── docs/               # Documentation
```

## Getting Help

- GitHub Issues: Report bugs or request features
- Telegram: Join our community channel
- Discord: Developer discussions

## License

MIT License - see LICENSE file for details.
