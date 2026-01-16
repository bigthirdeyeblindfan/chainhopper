# ChainHopper Task Queue

## CHECKOUT SYSTEM (READ FIRST!)

**To avoid rate limit errors, agents MUST checkout tasks before working.**

### Before Starting:
1. Pull latest: `git pull`
2. Check "Active Checkouts" below - skip tasks already checked out
3. Add your checkout row with task ID + timestamp
4. Commit + push the checkout BEFORE coding
5. Do the work
6. Mark task `DONE`, remove your checkout row, commit + push

### Checkout Format:
```
| F-006 | agent-1 | 2025-01-14 04:30 | 2hrs |
```

### Stale Checkouts:
If a checkout is >2 hours old with no commits, you may take it over.

---

## Active Checkouts

| Task ID | Agent | Checkout Time | Expires |
|---------|-------|---------------|---------|
| CHAIN-146 | claude-opus | 2026-01-16 14:45 | 2hrs |
| CHAIN-147 | claude-opus | 2026-01-16 14:45 | 2hrs |

---

## Status Legend
- `DONE` - Completed
- `IN_PROGRESS` - Checked out and being worked on
- `TODO` - Available (check Active Checkouts first!)

---

## Phase 1: Foundation

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| F-001 | Core Types & Interfaces | None | DONE | @chainhopper/types created |
| F-002 | Database Schema (Prisma) | F-001 | DONE | packages/core/prisma |
| F-003 | Authentication System | F-001 | DONE | packages/core/src/auth/ complete |
| F-004 | Base Adapter Implementation | F-001 | DONE | Interfaces in types |
| F-005 | TON Adapter | F-004 | DONE | STONfi + DeDust integration |
| F-006 | EVM Adapter (Generic) | F-004 | DONE | 1inch + ParaSwap, 10 chains |

---

## Phase 2: Interfaces

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| I-001 | REST API Core | F-003 | DONE | Auth, Trading, Portfolio, User routes |
| I-002 | Telegram Bot Core | F-003 | DONE | apps/bot complete |
| I-003 | Web Panel Setup | F-003 | DONE | Portfolio, Analytics, Settings, Trade pages |
| I-004 | WebSocket Server | I-001 | DONE | ws module: prices, trades, portfolio events |
| I-005 | API Documentation | I-001 | DONE | OpenAPI spec + auth routes complete |

---

## Phase 3: Smart Contracts

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| S-001 | FeeCollector Contract | None | DONE | FeeCollector.sol + tests complete |
| S-002 | SwapRouter Contract | S-001 | DONE | SwapRouter.sol + interfaces + tests |
| S-003 | ReferralRegistry Contract | S-001 | DONE | ReferralRegistry.sol + interface + tests |
| S-004 | Contract Deploy Scripts | S-001,S-002,S-003 | DONE | Foundry scripts + Makefile + configs |
| S-005 | TON Contract (FunC) | None | DONE | FunC + Tact implementations complete |

---

## Phase 4: Integration

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| INT-001 | Web ↔ API Integration | I-001,I-003 | DONE | API client + hooks + components connected |
| INT-002 | Telegram ↔ API Integration | I-001,I-002 | DONE | Bot API client + commands integrated |
| INT-003 | Contract Integration | S-004,F-005,F-006 | DONE | TS clients + service for FeeCollector, SwapRouter, ReferralRegistry |
| INT-004 | Price Oracle Integration | F-004 | DONE | Contracts + TS service (Chainlink/Pyth/DexScreener) |

---

## Phase 5: Polish & Launch

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| P-001 | Testing Suite | INT-* | DONE | 191 tests: EVM, TON adapters, aggregators, auth, oracle, contracts, API routes |
| P-002 | Security Audit Prep | S-* | DONE | Slither/Mythril configs + audit scripts + CI workflow |
| P-003 | Documentation | All | DONE | SDK docs, WebSocket guide, CONTRIBUTING.md, CHANGELOG.md |
| P-004 | Grant Applications | P-003 | TODO | Human task |
| P-005 | Beta Launch | All | DONE | Docker, nginx, CI/CD, deploy scripts |

---

## Phase 6: Chain Expansion (Complete)

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| CHAIN-001 | Sonic Chain Integration | F-006 | DONE | SwapX + Shadow DEX, aggregators, deploy scripts |
| CHAIN-002 | Berachain Integration | F-006 | DONE | OogaBooga aggregator, WBERA, RPC endpoints |
| CHAIN-003 | Sui Full Integration | F-004 | DONE | SuiChainAdapter + Cetus/Turbos DEX + tests |
| CHAIN-004 | Eclipse/SVM Integration | F-004 | DONE | EclipseAdapter + Jupiter + SVM types + tests |
| CHAIN-005 | Kaia Integration | F-006 | DONE | DragonSwap + KLAYswap DEXs, token addresses |

---

## Phase 7: Massive Chain Expansion (37 New Chains)

**Target: 47 total chains | Est. Deploy Cost: $270-615**

### 7A: Type & Config Updates

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| CHAIN-100 | Add 37 chain IDs to types | F-001 | DONE | packages/types/src/chains.ts |
| CHAIN-101 | Add chain configs | CHAIN-100 | DONE | chains.ts: IDs, configs, wrapped tokens |
| CHAIN-102 | Update viem mappings | CHAIN-101 | DONE | packages/adapters/src/evm/index.ts |
| CHAIN-103 | Update aggregators.ts | CHAIN-101 | DONE | 1inch/ParaSwap support for new chains |
| CHAIN-104 | Update adapter exports | CHAIN-103 | DONE | packages/adapters/src/index.ts |

### 7B: Originally Planned Chains (11)

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| CHAIN-110 | Monad Integration | CHAIN-101 | DONE | Chain 143, Kuru Exchange DEX |
| CHAIN-111 | Abstract Integration | CHAIN-101 | DONE | Chain 2741, AbstractSwap DEX |
| CHAIN-112 | Scroll Integration | CHAIN-101 | DONE | Chain 534352, SyncSwap/Ambient DEX |
| CHAIN-113 | Soneium Integration | CHAIN-101 | DONE | Chain 1868, Kyo Finance DEX |
| CHAIN-114 | XLayer Integration | CHAIN-101 | DONE | Chain 196, OKB gas token, XSwap DEX |
| CHAIN-115 | Ink Integration | CHAIN-101 | DONE | Chain 57073, Velodrome/Nado DEX |
| CHAIN-116 | 0G Integration | CHAIN-101 | DONE | Chain 16600, 0GSwap/Gravity DEX |
| CHAIN-117 | Astar Integration | CHAIN-101 | DONE | Chain 592, ArthSwap/Sirius DEX |
| CHAIN-118 | ApeChain Integration | CHAIN-101 | DONE | Chain 33139, Ape Portal/Camelot DEX |
| CHAIN-119 | Ronin Integration | CHAIN-101 | DONE | Chain 2020, Katana V2/V3 DEX |
| CHAIN-120 | Stable Integration | CHAIN-101 | DONE | Chain 988, USDT native gas, StableSwap DEX |

### 7C: Tier 1A - High TVL Chains (9)

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| CHAIN-130 | Linea Integration | CHAIN-101 | DONE | Chain 59144, ~$963M TVL, Lynex/SyncSwap DEX |
| CHAIN-131 | zkSync Era Integration | CHAIN-101 | DONE | Chain 324, ~$569M TVL, SyncSwap/Mute/SpaceFi DEX |
| CHAIN-132 | Blast Integration | CHAIN-101 | DONE | Chain 81457, Thruster V2/V3 + BladeSwap DEX |
| CHAIN-133 | Mantle Integration | CHAIN-101 | DONE | Chain 5000, ~$1B TVL, Merchant Moe/Agni/FusionX DEX |
| CHAIN-134 | Manta Pacific Integration | CHAIN-101 | DONE | Chain 169, ApertureSwap/QuickSwap DEX |
| CHAIN-135 | Mode Integration | CHAIN-101 | TODO | Chain 34443, Velodrome DEX |
| CHAIN-136 | Hyperliquid Integration | CHAIN-101 | DONE | Chain 999, HyperEVM Spot/Perps DEX |
| CHAIN-137 | Gnosis Integration | CHAIN-101 | DONE | Chain 100, Balancer/CoW/Curve/SushiSwap DEX |
| CHAIN-138 | Fantom Integration | CHAIN-101 | DONE | Chain 250, SpookySwap/SpiritSwap/BeethovenX DEX |

### 7D: Tier 1B - Strategic Chains (9)

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| CHAIN-140 | Unichain Integration | CHAIN-101 | DONE | Chain 130, Uniswap V3/V4 DEX |
| CHAIN-141 | Taiko Integration | CHAIN-101 | DONE | Chain 167000, Henjin/Panko/DTX DEX |
| CHAIN-142 | Metis Integration | CHAIN-101 | DONE | Chain 1088, Netswap/Tethys DEX |
| CHAIN-143 | Zora Integration | CHAIN-101 | DONE | Chain 7777777, Uniswap V3 DEX |
| CHAIN-144 | Fraxtal Integration | CHAIN-101 | DONE | Chain 252, Fraxswap/Ra Exchange DEX |
| CHAIN-145 | World Chain Integration | CHAIN-101 | DONE | Chain 480, Uniswap V3/WorldSwap DEX |
| CHAIN-146 | Celo Integration | CHAIN-101 | TODO | Chain 42220, Ubeswap DEX |
| CHAIN-147 | Cronos Integration | CHAIN-101 | TODO | Chain 25, VVS Finance DEX |
| CHAIN-148 | BOB Integration | CHAIN-101 | TODO | Chain 60808, BTC-ETH bridge |

### 7E: Tier 1C - Emerging Chains (8)

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| CHAIN-150 | Cyber Integration | CHAIN-101 | TODO | Chain 7560, Social/Creator |
| CHAIN-151 | Lisk Integration | CHAIN-101 | TODO | Chain 1135, Enterprise |
| CHAIN-152 | Mint Integration | CHAIN-101 | TODO | Chain 185, NFT focused |
| CHAIN-153 | Redstone Integration | CHAIN-101 | TODO | Chain 690, Gaming (MUD) |
| CHAIN-154 | Derive Integration | CHAIN-101 | TODO | Chain 957, Derive Protocol DEX |
| CHAIN-155 | Moonbeam Integration | CHAIN-101 | TODO | Chain 1284, StellaSwap DEX |
| CHAIN-156 | Moonriver Integration | CHAIN-101 | TODO | Chain 1285, Solarbeam DEX |
| CHAIN-157 | Starknet Integration | F-004 | TODO | Non-EVM (Cairo), Ekubo/Paradex DEX |

### 7F: Testing & Deployment

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| CHAIN-190 | Create tests for all 37 chains | CHAIN-1* | TODO | Unit + integration tests |
| CHAIN-191 | Update foundry.toml RPCs | CHAIN-1* | TODO | RPC endpoints for all chains |
| CHAIN-192 | Run full test suite | CHAIN-190 | TODO | Verify all adapters |
| CHAIN-193 | Deploy contracts to 37 chains | CHAIN-192 | TODO | Est. $270-615 total |

---

## Staggered Agent Commands

**Run ONE at a time, wait 60s between each to avoid rate limits:**

```bash
# Wave 1 - Independent tasks (no deps on each other)
claude "git pull && Read TASK_QUEUE.md. Checkout S-001 (FeeCollector), add to Active Checkouts, commit+push, then implement."

# Wait 60s...
claude "git pull && Read TASK_QUEUE.md. Checkout S-005 (TON Contract), add to Active Checkouts, commit+push, then implement."

# Wait 60s...
claude "git pull && Read TASK_QUEUE.md. Checkout F-006 (EVM Adapter), add to Active Checkouts, commit+push, then implement."

# Wave 2 - After F-003 completes
claude "git pull && Read TASK_QUEUE.md. Checkout I-001 (REST API), add to Active Checkouts, commit+push, then implement."

# Wait 60s...
claude "git pull && Read TASK_QUEUE.md. Checkout I-002 (Telegram Bot), add to Active Checkouts, commit+push, then implement."

# Wait 60s...
claude "git pull && Read TASK_QUEUE.md. Checkout I-003 (Web Panel), add to Active Checkouts, commit+push, then implement."
```

---

## Quick Reference

**Checkout a task:**
```bash
claude "git pull && Read TASK_QUEUE.md. Checkout task <ID>, commit the checkout, then implement it. When done mark DONE and remove checkout."
```

**Check status:**
```bash
claude "Read TASK_QUEUE.md. What tasks are available and not checked out?"
```

**Resume work:**
```bash
claude "git pull && Read TASK_QUEUE.md. I have task <ID> checked out. Continue implementing it."
```

---

## Task Specs

### F-003: Auth System
```
packages/core/src/auth/
- jwt.ts, apiKey.ts, telegram.ts, middleware.ts
```

### F-005: TON Adapter
```
packages/adapters/src/ton/
SDK: @ton/ton | DEXes: STONfi, DeDust
```

### F-006: EVM Adapter
```
packages/adapters/src/evm/
SDK: viem | Aggregators: 1inch, ParaSwap
```

### S-001: FeeCollector
```
packages/contracts/src/FeeCollector.sol
Profit-share: 15/10/5% tiers
```

### S-005: TON Contract
```
packages/contracts/ton/fee-collector.fc
FunC fee collection
```

---

*Last updated by agents on commit*
