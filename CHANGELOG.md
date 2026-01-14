# Changelog

All notable changes to ChainHopper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- SDK documentation for TypeScript and Python
- WebSocket API guide
- Contributing guidelines

---

## [0.1.0] - 2025-01-14

### Added

#### Core Infrastructure
- Monorepo setup with Turborepo
- Shared TypeScript types (`@chainhopper/types`)
- Core package with Prisma database schema
- Authentication system (JWT, API keys, Telegram)

#### Smart Contracts
- `FeeCollector.sol` - Profit-share fee model with tier system
- `SwapRouter.sol` - Multi-DEX swap routing
- `ReferralRegistry.sol` - On-chain referral tracking
- `PriceOracle.sol` - Chainlink/Pyth price feeds
- TON contracts (FunC + Tact implementations)
- Foundry test suite with 95%+ coverage
- Deployment scripts for all supported chains

#### Chain Adapters
- EVM adapter supporting 10 chains
  - Ethereum, Base, Arbitrum, Optimism, Polygon
  - BSC, Avalanche, Sonic, Kaia, Berachain
- DEX aggregator integrations (1inch, ParaSwap)
- TON adapter (STONfi, DeDust)

#### REST API (`apps/api`)
- Authentication endpoints (Telegram, JWT refresh, API keys)
- Trading endpoints (quotes, swap build/submit)
- Portfolio endpoints (balances, positions, P&L)
- User management endpoints
- OpenAPI/Swagger documentation
- Rate limiting middleware

#### WebSocket Server
- Real-time price streaming
- Trade status updates
- Portfolio change notifications
- Price alert triggers

#### Telegram Bot (`apps/bot`)
- Command handlers (/start, /swap, /balance, /history, etc.)
- Inline keyboard menus
- API integration for all operations
- Session management with auth tokens
- Multi-chain support

#### Web Panel (`apps/web`)
- Next.js 14 with App Router
- Portfolio dashboard
- Trade execution interface
- Analytics and P&L tracking
- Settings management
- Responsive design with Tailwind CSS

#### Documentation
- API reference (REST + WebSocket)
- Smart contract documentation
- Developer setup guide
- Deployment guide
- Telegram bot user guide
- SDK documentation

#### DevOps
- GitHub Actions CI/CD workflows
- Security audit scripts (Slither, Mythril)
- Docker Compose for local development
- Environment configuration templates

### Security
- ReentrancyGuard on all state-changing contract functions
- Input validation and sanitization
- JWT token expiration and refresh
- API key hashing with SHA-256
- Rate limiting on all endpoints

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2025-01-14 | Initial release with full feature set |

---

## Upgrade Notes

### Upgrading to 0.1.0

This is the initial release. No upgrade path required.

---

## Deprecations

None at this time.

---

## Migration Guides

### Database Migrations

Run Prisma migrations when upgrading:

```bash
cd packages/core
pnpm prisma migrate deploy
```

### Contract Upgrades

Contracts are not upgradeable by default. New deployments required for contract changes.

---

## Links

- [Documentation](./docs/README.md)
- [API Reference](./docs/API.md)
- [Smart Contracts](./docs/SMART_CONTRACTS.md)
- [Contributing](./CONTRIBUTING.md)
