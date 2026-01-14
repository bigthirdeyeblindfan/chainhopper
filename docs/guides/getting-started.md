# Getting Started

This guide walks you through setting up a ChainHopper development environment.

## Prerequisites

- **Node.js 20+** - JavaScript runtime
- **pnpm** - Package manager (recommended) or npm
- **Foundry** - Smart contract development
- **Docker** - For local database (optional)
- **Git** - Version control

### Install Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify
node --version  # Should show v20.x.x
```

### Install pnpm

```bash
npm install -g pnpm
```

### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify
forge --version
```

## Clone the Repository

```bash
git clone https://github.com/chainhopper/chainhopper.git
cd chainhopper
```

## Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Install contract dependencies
cd packages/contracts
forge install
cd ../..
```

## Environment Setup

### 1. Copy Environment Files

```bash
# Root environment
cp .env.example .env

# API service
cp apps/api/.env.example apps/api/.env

# Telegram bot
cp apps/bot/.env.example apps/bot/.env

# Web panel
cp apps/web/.env.example apps/web/.env

# Contracts
cp packages/contracts/.env.example packages/contracts/.env
```

### 2. Configure Environment Variables

Edit `.env` files with your values:

```bash
# apps/api/.env
DATABASE_URL="postgresql://user:password@localhost:5432/chainhopper"
JWT_SECRET="your-secure-secret-here"
TELEGRAM_BOT_TOKEN="your-bot-token"

# RPC URLs
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/..."
BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/..."
ARBITRUM_RPC_URL="https://arb-mainnet.g.alchemy.com/v2/..."

# DEX Aggregator Keys
ONEINCH_API_KEY="..."
PARASWAP_API_KEY="..."
```

### 3. Set Up Database

Using Docker:

```bash
docker-compose up -d postgres

# Run migrations
cd packages/core
pnpm prisma migrate dev
```

Or use a cloud database (Supabase, Neon, etc.):

```bash
# Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@your-cloud-db.com:5432/chainhopper"

# Run migrations
cd packages/core
pnpm prisma migrate deploy
```

## Development Workflow

### Start All Services

```bash
# Terminal 1: Start database
docker-compose up -d postgres

# Terminal 2: Start API
cd apps/api
pnpm dev

# Terminal 3: Start Telegram bot
cd apps/bot
pnpm dev

# Terminal 4: Start web panel
cd apps/web
pnpm dev
```

### Or use Turbo (recommended)

```bash
# Start all services in development mode
pnpm dev

# Start specific apps
pnpm dev --filter=api
pnpm dev --filter=bot
pnpm dev --filter=web
```

### Access the Services

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Web Panel | http://localhost:3001 |
| Bot | Talk to your bot on Telegram |

## Smart Contract Development

### Build Contracts

```bash
cd packages/contracts
forge build
```

### Run Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testSwap

# Run with gas report
forge test --gas-report
```

### Local Deployment

```bash
# Start local node
anvil

# Deploy to local node
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url http://localhost:8545 \
  --broadcast
```

## Testing

### Run All Tests

```bash
# Root level - runs all tests
pnpm test

# Specific package
pnpm test --filter=core
pnpm test --filter=api
```

### Run Contract Tests

```bash
cd packages/contracts

# Unit tests
forge test

# Fuzz tests
forge test --match-test "fuzz"

# Invariant tests
forge test --match-test "invariant"

# Coverage
forge coverage
```

### Run E2E Tests

```bash
pnpm test:e2e
```

## Linting & Formatting

```bash
# Lint all code
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Format Solidity
cd packages/contracts
forge fmt
```

## Type Checking

```bash
pnpm typecheck
```

## Building for Production

```bash
# Build all packages
pnpm build

# Build specific app
pnpm build --filter=api
pnpm build --filter=web
```

## Common Issues

### "Cannot find module" errors

```bash
# Clean and reinstall
rm -rf node_modules
pnpm install
```

### Database connection issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Reset database
cd packages/core
pnpm prisma migrate reset
```

### Contract compilation errors

```bash
# Update dependencies
cd packages/contracts
forge update

# Clean build
forge clean
forge build
```

### Port already in use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Project Structure

```
chainhopper/
├── apps/
│   ├── api/                 # REST API
│   │   ├── src/
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   └── middleware/  # Express middleware
│   │   └── package.json
│   │
│   ├── bot/                 # Telegram bot
│   │   ├── src/
│   │   │   ├── commands/    # Bot commands
│   │   │   ├── menus/       # Inline menus
│   │   │   └── callbacks/   # Callback handlers
│   │   └── package.json
│   │
│   └── web/                 # Web panel
│       ├── src/
│       │   ├── app/         # Next.js app router
│       │   ├── components/  # React components
│       │   └── hooks/       # Custom hooks
│       └── package.json
│
├── packages/
│   ├── adapters/            # Chain adapters
│   │   ├── src/
│   │   │   ├── evm/         # EVM chains
│   │   │   ├── ton/         # TON
│   │   │   └── sui/         # Sui
│   │   └── package.json
│   │
│   ├── contracts/           # Smart contracts
│   │   ├── src/             # Solidity contracts
│   │   ├── test/            # Forge tests
│   │   ├── script/          # Deploy scripts
│   │   └── foundry.toml
│   │
│   ├── core/                # Shared logic
│   │   ├── src/
│   │   │   ├── auth/        # Authentication
│   │   │   ├── db/          # Database
│   │   │   └── services/    # Core services
│   │   └── package.json
│   │
│   └── types/               # Shared types
│       └── src/
│
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── turbo.json               # Turborepo config
└── package.json             # Root package.json
```

## Next Steps

- [API Reference](../api/README.md) - Learn the API endpoints
- [Smart Contracts](../contracts/README.md) - Understand the contract architecture
- [Telegram Bot Guide](./telegram-bot.md) - Set up and customize the bot

## Getting Help

- **GitHub Issues:** Report bugs or request features
- **Discord:** Join our developer community
- **Telegram:** Ask questions in our support channel
