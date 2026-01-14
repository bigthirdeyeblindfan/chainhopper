# ChainHopper Developer Guide

Complete guide for setting up and contributing to ChainHopper.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Development Workflows](#development-workflows)
- [Testing](#testing)
- [Code Style](#code-style)

---

## Architecture Overview

ChainHopper is a multi-chain trading bot with a profit-share fee model. The system consists of:

```
┌─────────────────────────────────────────────────────────────┐
│                       User Interfaces                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Telegram Bot   │    Web Panel    │      API (Direct)       │
│   (apps/bot)    │   (apps/web)    │                         │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
         ┌─────────────────▼─────────────────┐
         │           REST API                 │
         │          (apps/api)                │
         │  ┌─────────────────────────────┐  │
         │  │ Routes: Auth, Trading,      │  │
         │  │ Portfolio, User, Analytics  │  │
         │  └─────────────────────────────┘  │
         │  ┌─────────────────────────────┐  │
         │  │ WebSocket: Prices, Trades,  │  │
         │  │ Portfolio Updates           │  │
         │  └─────────────────────────────┘  │
         └─────────────────┬─────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼───┐            ┌─────▼─────┐          ┌────▼────┐
│ Core  │            │ Adapters  │          │Contracts│
│Package│            │  Package  │          │ Package │
└───┬───┘            └─────┬─────┘          └────┬────┘
    │                      │                     │
    │ • Auth (JWT/API)     │ • EVM Adapter       │ • FeeCollector
    │ • Oracle Service     │   (1inch/ParaSwap)  │ • SwapRouter
    │ • Contract Clients   │ • TON Adapter       │ • ReferralRegistry
    │ • Database (Prisma)  │   (STONfi/DeDust)   │ • PriceOracle
    └──────────────────────┴─────────────────────┴─────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
        ┌───▼───┐     ┌────▼────┐    ┌────▼────┐
        │  EVM  │     │   TON   │    │   Sui   │
        │Chains │     │ Network │    │ Network │
        └───────┘     └─────────┘    └─────────┘
```

### Key Components

| Component | Location | Description |
|-----------|----------|-------------|
| **API Server** | `apps/api/` | Hono-based REST API + WebSocket server |
| **Telegram Bot** | `apps/bot/` | Grammy-based Telegram bot |
| **Web Panel** | `apps/web/` | Next.js 14 web application |
| **Core Package** | `packages/core/` | Auth, Oracle, Contract clients, Database |
| **Adapters** | `packages/adapters/` | Chain-specific DEX integrations |
| **Contracts** | `packages/contracts/` | Solidity smart contracts (Foundry) |
| **Types** | `packages/types/` | Shared TypeScript types |

---

## Prerequisites

- **Node.js** 20+ (recommend using `nvm`)
- **pnpm** 8+ (for monorepo management)
- **Foundry** (for smart contract development)
- **Docker** (optional, for local database)
- **GitHub CLI** (`gh`) for agent workflows

### Install Prerequisites

```bash
# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# pnpm
npm install -g pnpm

# Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# GitHub CLI
brew install gh  # macOS
# or: https://cli.github.com/
```

---

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourorg/chainhopper.git
cd chainhopper

# Install all dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment templates
cp apps/api/.env.example apps/api/.env
cp apps/bot/.env.example apps/bot/.env
cp apps/web/.env.example apps/web/.env

# Edit with your values
```

**Required Environment Variables:**

```env
# apps/api/.env
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/chainhopper
JWT_SECRET=your-secret-key
TELEGRAM_BOT_TOKEN=your-bot-token

# RPC URLs (get from Alchemy, Infura, etc.)
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/xxx
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/xxx
TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC

# DEX Aggregator API Keys
ONEINCH_API_KEY=xxx
PARASWAP_API_KEY=xxx
```

### 3. Database Setup

```bash
# Option 1: Use Docker
docker-compose up -d postgres

# Option 2: Use local PostgreSQL
createdb chainhopper

# Run migrations
cd packages/core
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. Build Packages

```bash
# Build all packages
pnpm build

# Or build specific package
pnpm --filter @chainhopper/types build
pnpm --filter @chainhopper/core build
```

### 5. Start Development Servers

```bash
# Start all apps in development mode
pnpm dev

# Or start specific apps
pnpm --filter api dev      # API server on :3000
pnpm --filter web dev      # Web panel on :3001
pnpm --filter bot dev      # Telegram bot
```

---

## Project Structure

```
chainhopper/
├── apps/
│   ├── api/                    # REST API + WebSocket server
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── ws/             # WebSocket handlers
│   │   │   ├── app.ts          # Hono app setup
│   │   │   └── index.ts        # Server entry point
│   │   └── package.json
│   │
│   ├── bot/                    # Telegram bot
│   │   ├── src/
│   │   │   ├── commands/       # Bot commands (/start, /trade, etc.)
│   │   │   ├── callbacks/      # Inline keyboard handlers
│   │   │   ├── menus/          # Menu builders
│   │   │   └── index.ts        # Bot entry point
│   │   └── package.json
│   │
│   └── web/                    # Next.js web panel
│       ├── src/
│       │   ├── app/            # App router pages
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom React hooks
│       │   └── lib/            # API client, utilities
│       └── package.json
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   │   └── src/
│   │       ├── chains.ts       # Chain definitions
│   │       ├── trading.ts      # Trade types
│   │       ├── users.ts        # User types
│   │       └── index.ts
│   │
│   ├── core/                   # Core business logic
│   │   ├── src/
│   │   │   ├── auth/           # JWT, API key, Telegram auth
│   │   │   ├── contracts/      # Contract client wrappers
│   │   │   ├── oracle/         # Price oracle service
│   │   │   └── prisma/         # Database client
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   │
│   ├── adapters/               # Chain adapters
│   │   └── src/
│   │       ├── evm/            # EVM chains (1inch, ParaSwap)
│   │       └── ton/            # TON (STONfi, DeDust)
│   │
│   └── contracts/              # Smart contracts (Foundry)
│       ├── src/                # Contract source files
│       ├── test/               # Foundry tests
│       ├── script/             # Deployment scripts
│       └── foundry.toml
│
├── docs/                       # Documentation
│   ├── api/
│   │   └── openapi.yaml        # OpenAPI specification
│   ├── API.md                  # API reference
│   ├── DEVELOPER_GUIDE.md      # This file
│   └── DEPLOYMENT.md           # Deployment guide
│
├── scripts/                    # Utility scripts
│   └── agent.py                # Agent workflow script
│
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # Workspace config
└── package.json                # Root package.json
```

---

## Development Workflows

### Adding a New API Endpoint

1. **Define types** in `packages/types/src/`:
```typescript
// packages/types/src/trading.ts
export interface NewFeature {
  id: string;
  // ...
}
```

2. **Create route handler** in `apps/api/src/routes/`:
```typescript
// apps/api/src/routes/feature.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/feature', async (c) => {
  // Implementation
  return c.json({ data: [] });
});

export { app as featureRoutes };
```

3. **Register route** in `apps/api/src/app.ts`:
```typescript
import { featureRoutes } from './routes/feature.js';
app.route('/feature', featureRoutes);
```

4. **Update OpenAPI spec** in `docs/api/openapi.yaml`

### Adding a New Chain Adapter

1. **Create adapter directory**:
```bash
mkdir -p packages/adapters/src/newchain
```

2. **Implement adapter interface**:
```typescript
// packages/adapters/src/newchain/adapter.ts
import type { ChainAdapter, Quote, SwapParams } from '@chainhopper/types';

export class NewChainAdapter implements ChainAdapter {
  async getQuote(params: SwapParams): Promise<Quote> {
    // Implementation
  }

  async buildSwapTx(quote: Quote): Promise<Transaction> {
    // Implementation
  }
}
```

3. **Export from index**:
```typescript
// packages/adapters/src/newchain/index.ts
export { NewChainAdapter } from './adapter.js';
```

4. **Add chain to types**:
```typescript
// packages/types/src/chains.ts
export const CHAINS = {
  // ...existing
  newchain: {
    id: 'newchain',
    name: 'New Chain',
    // ...
  }
} as const;
```

### Working with Smart Contracts

```bash
cd packages/contracts

# Build contracts
forge build

# Run tests
forge test

# Run tests with verbosity
forge test -vvv

# Run specific test
forge test --match-test testCollectProfitFee

# Check gas usage
forge test --gas-report

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC --broadcast
```

---

## Testing

### TypeScript Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @chainhopper/core test

# Run tests in watch mode
pnpm --filter @chainhopper/core test:watch

# Run with coverage
pnpm --filter @chainhopper/core test:coverage
```

### Smart Contract Tests

```bash
cd packages/contracts

# Run all tests
forge test

# Run with gas report
forge test --gas-report

# Run with coverage
forge coverage

# Run specific test file
forge test --match-path test/FeeCollector.t.sol
```

### E2E Tests

```bash
# Run e2e tests (requires running API)
pnpm e2e

# Run specific e2e test
pnpm e2e --grep "trading"
```

---

## Code Style

### TypeScript

- Use **ESLint** + **Prettier** (config in root)
- Strict TypeScript (`strict: true`)
- Prefer `type` over `interface` for data shapes
- Use barrel exports (`index.ts`)

```bash
# Lint all files
pnpm lint

# Fix lint errors
pnpm lint:fix

# Format with Prettier
pnpm format
```

### Solidity

- Use **Foundry** formatter
- Follow **NatSpec** documentation
- Use custom errors (not `require`)
- OpenZeppelin for security patterns

```bash
cd packages/contracts

# Format Solidity
forge fmt

# Check formatting
forge fmt --check
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(api): add portfolio summary endpoint
fix(bot): handle rate limit errors
docs: update API reference
chore: update dependencies
```

---

## Agent Workflow

ChainHopper uses Claude Code for AI-assisted development:

```bash
# Implement a GitHub issue
python scripts/agent.py implement --issue 42

# Review a PR
python scripts/agent.py review --pr 42

# Security review
python scripts/agent.py security-review --pr 42
```

See [README.md](../README.md) for full agent documentation.

---

## Troubleshooting

### Common Issues

**pnpm install fails**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**TypeScript errors after pulling**
```bash
# Rebuild all packages
pnpm build
```

**Foundry tests fail**
```bash
# Update dependencies
cd packages/contracts
forge install
```

**Database connection errors**
```bash
# Ensure PostgreSQL is running
docker-compose up -d postgres

# Reset database
pnpm --filter @chainhopper/core prisma migrate reset
```

### Getting Help

- Create an issue on GitHub
- Check existing documentation in `/docs`
- Review OpenAPI spec at `/docs/api/openapi.yaml`
