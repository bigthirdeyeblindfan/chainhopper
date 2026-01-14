# ChainHopper Deployment Guide

Guide for deploying ChainHopper to production environments.

## Table of Contents

- [Infrastructure Overview](#infrastructure-overview)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Telegram Bot Deployment](#telegram-bot-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Infrastructure Overview

### Recommended Production Stack

```
┌────────────────────────────────────────────────────────────┐
│                     Cloudflare (CDN/WAF)                   │
└──────────────────────────┬─────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌─────▼─────┐      ┌────▼────┐
   │   Web   │       │    API    │      │   Bot   │
   │ Vercel  │       │  Railway  │      │ Railway │
   └─────────┘       └─────┬─────┘      └─────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │   Neon.tech │
                    └─────────────┘

Smart Contracts: Deployed on each supported chain
```

### Service Recommendations

| Service | Provider Options | Notes |
|---------|------------------|-------|
| Web Panel | Vercel, Cloudflare Pages | Next.js optimized |
| API Server | Railway, Fly.io, Render | Node.js with WebSocket |
| Bot | Railway, Fly.io | Long-running process |
| Database | Neon, Supabase, PlanetScale | PostgreSQL preferred |
| Contracts | Chain-specific | Foundry deployment |

---

## Smart Contract Deployment

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Set up environment
cd packages/contracts
cp .env.example .env
```

### Environment Variables

```env
# Private key for deployment (use hardware wallet for mainnet!)
PRIVATE_KEY=0x...

# RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/xxx
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/xxx
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/xxx
# ... add more chains

# Etherscan API keys for verification
ETHERSCAN_API_KEY=xxx
BASESCAN_API_KEY=xxx
ARBISCAN_API_KEY=xxx

# Treasury address (multi-sig recommended)
TREASURY_ADDRESS=0x...
```

### Deployment Steps

#### 1. Deploy to Testnet First

```bash
cd packages/contracts

# Deploy to Sepolia (Ethereum testnet)
make deploy-sepolia

# Or manually:
forge script script/DeployAll.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

#### 2. Verify Contracts

```bash
# Verify on block explorer
forge verify-contract \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(address)" $TREASURY_ADDRESS) \
  $DEPLOYED_ADDRESS \
  src/FeeCollector.sol:FeeCollector
```

#### 3. Test on Testnet

- Execute test trades
- Verify fee collection
- Test referral system
- Check admin functions

#### 4. Deploy to Mainnet

```bash
# Deploy to Base mainnet
make deploy-base

# Deploy to all chains
make deploy-all
```

### Contract Addresses

After deployment, update `packages/core/src/contracts/addresses.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  ethereum: {
    feeCollector: '0x...',
    swapRouter: '0x...',
    referralRegistry: '0x...',
  },
  base: {
    feeCollector: '0x...',
    swapRouter: '0x...',
    referralRegistry: '0x...',
  },
  // ... other chains
} as const;
```

### Post-Deployment Configuration

```bash
# Configure tier settings
cast send $FEE_COLLECTOR "setTierConfig(uint8,uint256,bool)" 0 1500 true --private-key $PRIVATE_KEY

# Set up referral tiers
cast send $FEE_COLLECTOR "setReferralTier(uint256,uint256,uint256,uint256)" 0 0 2000 500 --private-key $PRIVATE_KEY

# Transfer ownership to multi-sig
cast send $FEE_COLLECTOR "transferOwnership(address)" $MULTISIG_ADDRESS --private-key $PRIVATE_KEY
```

---

## Backend Deployment

### Railway Deployment

#### 1. Create Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init
```

#### 2. Configure Services

Create `railway.json` in project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm --filter api start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

#### 3. Set Environment Variables

```bash
# Set via CLI
railway variables set PORT=3000
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="..."
railway variables set TELEGRAM_BOT_TOKEN="..."

# Or use Railway dashboard
```

#### 4. Deploy

```bash
# Deploy from current branch
railway up

# Or connect to GitHub for auto-deploy
railway link
```

### Fly.io Deployment (Alternative)

#### 1. Create `fly.toml`

```toml
app = "chainhopper-api"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = 10000
    grace_period = "5s"
    method = "get"
    path = "/health"
    timeout = 2000
```

#### 2. Deploy

```bash
fly launch
fly secrets set DATABASE_URL="..." JWT_SECRET="..."
fly deploy
```

### Database Setup (Neon)

#### 1. Create Database

1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string

#### 2. Run Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
cd packages/core
pnpm prisma migrate deploy
```

#### 3. Configure Connection Pooling

For serverless environments, use Neon's connection pooler:

```env
# Use pooled connection string
DATABASE_URL="postgresql://...@ep-xxx.us-east-2.aws.neon.tech/chainhopper?sslmode=require&pgbouncer=true"
```

---

## Frontend Deployment

### Vercel Deployment

#### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Select `apps/web` as root directory

#### 2. Configure Build Settings

```
Framework Preset: Next.js
Root Directory: apps/web
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

#### 3. Set Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.chainhopper.io
NEXT_PUBLIC_WS_URL=wss://api.chainhopper.io/ws
```

#### 4. Deploy

Vercel auto-deploys on push to main branch.

### Custom Domain

1. Add domain in Vercel dashboard
2. Update DNS records:
   - A record: `76.76.21.21`
   - CNAME: `cname.vercel-dns.com`
3. Enable HTTPS (automatic)

---

## Telegram Bot Deployment

### Railway Deployment

#### 1. Create Bot Service

```bash
# In project root
railway service create bot
```

#### 2. Configure Start Command

```json
{
  "deploy": {
    "startCommand": "pnpm --filter bot start"
  }
}
```

#### 3. Set Environment Variables

```bash
railway variables set TELEGRAM_BOT_TOKEN="..."
railway variables set API_URL="https://api.chainhopper.io"
railway variables set WEBHOOK_URL="https://bot.chainhopper.io/webhook"
```

### Webhook vs Polling

**For Production (Webhook):**

```typescript
// apps/bot/src/index.ts
bot.api.setWebhook('https://bot.chainhopper.io/webhook');
```

**For Development (Polling):**

```typescript
bot.start();
```

### Health Check Endpoint

Add health check for Railway/Fly.io:

```typescript
// apps/bot/src/health.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();
app.get('/health', (c) => c.json({ status: 'ok' }));

serve({ fetch: app.fetch, port: 8080 });
```

---

## Monitoring & Maintenance

### Health Monitoring

#### Uptime Monitoring

Use services like:
- [Better Uptime](https://betterstack.com/better-uptime)
- [Checkly](https://www.checklyhq.com/)
- [Pingdom](https://www.pingdom.com/)

Configure alerts for:
- API health endpoint (`/health`)
- WebSocket connectivity
- Database connection

#### Logging

```typescript
// Use structured logging
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});
```

**Log Aggregation Services:**
- [Logtail](https://betterstack.com/logtail)
- [Datadog](https://www.datadoghq.com/)
- [Papertrail](https://www.papertrail.com/)

### Contract Monitoring

#### Event Monitoring

Use services to monitor contract events:

```bash
# Example: Monitor FeeCollector events
cast logs --from-block latest \
  --address $FEE_COLLECTOR \
  "ProfitFeeCollected(address,address,uint256,uint256,address,uint256)"
```

**Monitoring Services:**
- [Tenderly](https://tenderly.co/)
- [OpenZeppelin Defender](https://www.openzeppelin.com/defender)
- [Chainlink Automation](https://chain.link/automation)

### Security Checklist

- [ ] Multi-sig wallet for treasury
- [ ] Contract ownership transferred to multi-sig
- [ ] Rate limiting enabled on API
- [ ] CORS configured properly
- [ ] API keys have appropriate permissions
- [ ] Database backups enabled
- [ ] Secrets stored securely (not in code)
- [ ] SSL/TLS enabled everywhere
- [ ] DDoS protection (Cloudflare)

### Maintenance Tasks

#### Regular Tasks

| Task | Frequency | Notes |
|------|-----------|-------|
| Database backup verification | Weekly | Test restore process |
| Dependency updates | Monthly | Security patches |
| Log review | Weekly | Check for anomalies |
| Contract pause test | Quarterly | Ensure emergency stops work |

#### Emergency Procedures

**API Incident:**
1. Check health endpoint
2. Review logs for errors
3. Rollback if needed: `railway rollback`

**Contract Incident:**
1. Pause contract: `cast send $CONTRACT "pause()" --private-key $ADMIN_KEY`
2. Investigate issue
3. Deploy fix if needed
4. Unpause: `cast send $CONTRACT "unpause()" --private-key $ADMIN_KEY`

---

## Cost Estimates

### Monthly Infrastructure Costs

| Service | Provider | Estimated Cost |
|---------|----------|----------------|
| API Server | Railway | $10-50/month |
| Database | Neon | $0-25/month |
| Web Hosting | Vercel | $0-20/month |
| Bot Hosting | Railway | $5-20/month |
| Monitoring | Various | $0-50/month |
| **Total** | | **$15-165/month** |

### Contract Deployment Costs

| Chain | Estimated Gas Cost |
|-------|-------------------|
| Ethereum | 0.1-0.5 ETH |
| Base | 0.001-0.01 ETH |
| Arbitrum | 0.01-0.05 ETH |
| Polygon | 1-5 MATIC |
| BSC | 0.01-0.05 BNB |

---

## Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables documented
- [ ] Backup strategy defined
- [ ] Monitoring configured
- [ ] Incident response plan

### Post-Deployment

- [ ] Smoke tests passing
- [ ] Health checks responding
- [ ] Logs flowing correctly
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified
