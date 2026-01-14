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
| I-001 | agent-api | 2025-01-14 | 2hrs |
| S-002 | agent-d | 2025-01-14 | 2hrs |
| S-005 | agent-contracts | 2025-01-14 | 2hrs |

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
| I-001 | REST API Core | F-003 | IN_PROGRESS | Hono + endpoints |
| I-002 | Telegram Bot Core | F-003 | DONE | apps/bot complete |
| I-003 | Web Panel Setup | F-003 | TODO | Next.js + UI |
| I-004 | WebSocket Server | I-001 | TODO | Real-time updates |
| I-005 | API Documentation | I-001 | TODO | OpenAPI spec |

---

## Phase 3: Smart Contracts

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| S-001 | FeeCollector Contract | None | DONE | FeeCollector.sol + tests complete |
| S-002 | SwapRouter Contract | S-001 | IN_PROGRESS | Swap interface |
| S-003 | ReferralRegistry Contract | S-001 | TODO | Referral tracking |
| S-004 | Contract Deploy Scripts | S-001,S-002,S-003 | TODO | Foundry scripts |
| S-005 | TON Contract (FunC) | None | IN_PROGRESS | FunC fee collector |

---

## Phase 4: Integration

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| INT-001 | Web ↔ API Integration | I-001,I-003 | TODO | Frontend connects |
| INT-002 | Telegram ↔ API Integration | I-001,I-002 | TODO | Bot calls API |
| INT-003 | Contract Integration | S-004,F-005,F-006 | TODO | Adapters + contracts |
| INT-004 | Price Oracle Integration | F-004 | TODO | Chainlink/Pyth |

---

## Phase 5: Polish & Launch

| ID | Task | Dependencies | Status | Notes |
|----|------|--------------|--------|-------|
| P-001 | Testing Suite | INT-* | TODO | Unit + e2e tests |
| P-002 | Security Audit Prep | S-* | TODO | Slither + Mythril |
| P-003 | Documentation | All | TODO | API docs, guides |
| P-004 | Grant Applications | P-003 | TODO | Human task |
| P-005 | Beta Launch | All | TODO | Production deploy |

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
