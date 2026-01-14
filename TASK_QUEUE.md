# ChainHopper Task Queue

**Instructions for Agents**: Read this file, find the first task with status `TODO` where all dependencies are `DONE`, mark it `IN_PROGRESS`, do the work, then mark it `DONE` and commit.

**How to use**: Open Claude and say: `"Read TASK_QUEUE.md and do the next available task. Update the file when done."`

---

## Status Legend
- `DONE` - Completed
- `IN_PROGRESS` - Currently being worked on (by which agent)
- `TODO` - Ready to start (check dependencies first)
- `BLOCKED` - Waiting on something

---

## Phase 1: Foundation

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| F-001 | Core Types & Interfaces | None | DONE | @chainhopper/types created |
| F-002 | Database Schema (Prisma) | F-001 | TODO | packages/core - Agent 5 may be doing this |
| F-003 | Authentication System | F-001 | TODO | JWT + API key auth in packages/core |
| F-004 | Base Adapter Implementation | F-001 | DONE | Interfaces in @chainhopper/types |
| F-005 | TON Adapter | F-004 | TODO | packages/adapters/ton |
| F-006 | EVM Adapter (Generic) | F-004 | TODO | packages/adapters/evm |

---

## Phase 2: Interfaces

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| I-001 | REST API Core | F-003 | TODO | Agent 3 setting up skeleton |
| I-002 | Telegram Bot Core | F-003 | TODO | Agent 1 setting up skeleton |
| I-003 | Web Panel Setup | F-003 | TODO | Agent 4 setting up skeleton |
| I-004 | WebSocket Server | I-001 | TODO | Real-time price/trade updates |
| I-005 | API Documentation (OpenAPI) | I-001 | TODO | Swagger/OpenAPI spec |

---

## Phase 3: Smart Contracts

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| S-001 | FeeCollector Contract | None | TODO | Agent 2 may be doing this |
| S-002 | SwapRouter Contract | S-001 | TODO | Unified swap interface |
| S-003 | ReferralRegistry Contract | S-001 | TODO | On-chain referral tracking |
| S-004 | Contract Deployment Scripts | S-001,S-002,S-003 | TODO | Foundry scripts |
| S-005 | TON Contract (FunC) | None | TODO | FunC fee collector |

---

## Phase 4: Integration

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| INT-001 | Web Panel ↔ API Integration | I-001,I-003 | TODO | Connect frontend to backend |
| INT-002 | Telegram ↔ API Integration | I-001,I-002 | TODO | Bot calls API for trades |
| INT-003 | Contract Integration | S-004,F-005,F-006 | TODO | Adapters call contracts |
| INT-004 | Price Oracle Integration | F-004 | TODO | Chainlink/Pyth/DexScreener |

---

## Phase 5: Polish & Launch

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| P-001 | Testing Suite | INT-* | TODO | Unit + integration + e2e |
| P-002 | Security Audit Prep | S-* | TODO | Slither + Mythril |
| P-003 | Documentation | All | TODO | API docs, user guides |
| P-004 | Grant Applications | P-003 | TODO | Human task |
| P-005 | Beta Launch | All | TODO | Deploy to production |

---

## Detailed Task Specs

### F-002: Database Schema (Prisma)
```
Location: packages/core/prisma/schema.prisma
Models needed:
- User (id, telegramId, email, tier, referralCode, settings, createdAt)
- Wallet (id, userId, chainId, address, isDefault)
- Trade (id, userId, chainId, tokenIn, tokenOut, amountIn, amountOut, txHash, status, profit)
- Position (id, userId, trades, entryPrice, exitPrice, pnl, isOpen)
- Referral (id, referrerId, refereeId, code, tier, totalVolume, earnings)
- ApiKey (id, userId, keyHash, permissions, rateLimit, expiresAt)
- FeeCollection (id, tradeId, amount, txHash, collectedAt)
```

### F-003: Authentication System
```
Location: packages/core/src/auth/
Files:
- jwt.ts - JWT token generation/verification
- apiKey.ts - API key generation/validation
- telegram.ts - Telegram user verification
- middleware.ts - Auth middleware for Hono
```

### F-005: TON Adapter
```
Location: packages/adapters/src/ton/
- Use @ton/ton SDK
- Implement ChainAdapter interface from @chainhopper/types
- Support STONfi and DeDust DEXes
- Handle jetton transfers
```

### F-006: EVM Adapter
```
Location: packages/adapters/src/evm/
- Use viem
- Implement ChainAdapter interface
- Support 1inch/ParaSwap/0x aggregators
- Generic for all EVM chains (config per chain)
```

### I-004: WebSocket Server
```
Location: apps/api/src/ws/
Channels:
- prices:{chainId} - Real-time price updates
- trades:{userId} - User's trade updates
- positions:{userId} - Position P&L updates
```

### S-002: SwapRouter Contract
```
Location: packages/contracts/src/SwapRouter.sol
- Takes swap calldata from aggregator
- Calls FeeCollector to record trade
- Emits events for tracking
- Non-custodial (user signs tx)
```

### S-003: ReferralRegistry Contract
```
Location: packages/contracts/src/ReferralRegistry.sol
- Register referral codes on-chain
- Track referee → referrer mapping
- Calculate and distribute referral rewards
- Emit events for off-chain tracking
```

### INT-004: Price Oracle Integration
```
Location: packages/core/src/oracle/
Sources (in priority order):
1. Chainlink (most reliable for majors)
2. Pyth (fast updates)
3. DexScreener API (for new tokens)
4. DEX spot price (last resort)
```

---

## Agent Assignment (for parallel work)

If you're starting fresh and want to parallelize:

```bash
# Agent 1 - After bot skeleton done
claude "Read TASK_QUEUE.md. Complete I-002 (Telegram Bot Core) - add swap commands, wallet connection, inline menus."

# Agent 2 - After contracts skeleton done
claude "Read TASK_QUEUE.md. Complete S-002 (SwapRouter) and S-003 (ReferralRegistry) contracts."

# Agent 3 - After API skeleton done
claude "Read TASK_QUEUE.md. Complete I-001 (REST API Core) - add /quote, /swap, /portfolio endpoints."

# Agent 4 - After web skeleton done
claude "Read TASK_QUEUE.md. Complete I-003 (Web Panel) - add dashboard, portfolio view, trade UI."

# Agent 5 - After Prisma schema done
claude "Read TASK_QUEUE.md. Complete F-003 (Auth System) - JWT, API keys, Telegram verification."

# Agent 6 - Adapters
claude "Read TASK_QUEUE.md. Complete F-005 (TON Adapter) and F-006 (EVM Adapter)."
```

---

## Completion Checklist

When marking a task DONE, ensure:
- [ ] Code compiles without errors
- [ ] Basic tests pass (if applicable)
- [ ] Changes committed with conventional commit message
- [ ] This file updated with DONE status
- [ ] Any blockers for dependent tasks noted

---

*Last updated: [Agent updates this timestamp]*
