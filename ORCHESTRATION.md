# 🎯 MASTER ORCHESTRATION DOCUMENT

## Project: Multi-Chain Trading Bot (Codename: "ChainHopper")

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Status**: Pre-Launch Development

---

## 🌟 Core Value Proposition

**"Free to trade. Pay only when you profit."**

In a $70M/day market where every competitor charges flat 0.5-1% fees regardless of outcome, we only take a cut when users actually make money. This is genuinely novel—no Telegram trading bot has implemented this model.

---

## 🏆 Competitive Landscape

### Market Leaders We're Disrupting

| Bot | Lifetime Volume | Market Share | Fee | Our Edge |
|-----|-----------------|--------------|-----|----------|
| Trojan | $25B+ | Leader (Solana) | 1% flat | Profit-share alignment |
| Axiom | $20.5B+ | 57% (rose from 4% in 5mo) | 0.75-1% | Multi-chain + API |
| BONKbot | $14B | Major player | 1% → BONK burn | Beyond Solana |
| Maestro | $13.2B | 10+ chains | 1% or $200/mo | Better execution |
| Banana Gun | $5.3B | 92% snipe rate | 1%/0.5% | No sniping focus |

**Key Insight**: Axiom's rise from 4% to 57% market share in 5 months proves this market is highly contestable despite apparent leaders.

### Strategic Whitespace (First-Mover Chains)

| Chain | Current Bot Landscape | Opportunity |
|-------|----------------------|-------------|
| **Sonic** | Zero established bots | 🔴 VERY HIGH |
| **Kaia** | Zero trading bots | 🔴 VERY HIGH (250M LINE/Kakao users) |
| **Berachain** | No bot infrastructure | 🔴 HIGH ($3B TVL) |
| **Sui** | Fragmented (Capy, Meow) | 🟡 HIGH |
| **TON** | Limited (Maestro, sTONKs) | 🟡 MEDIUM (low volume risk) |

### Our Differentiation Stack

1. **Profit-Share Fees** - Unique in the market (dHEDGE/Enzyme prove model works)
2. **15-Chain Support** - Broadest coverage (Maestro has 10)
3. **Public API** - No competitor offers trading APIs
4. **Triple Interface** - Web + Telegram + API (most are Telegram-only)
5. **On-Chain Transparency** - All fees verifiable via smart contract
6. **AI Trading Signals** - 67% of Gen Z traders want this (Phase 2)
7. **Cross-Chain Portfolio** - Unified P&L tracking (no one does this well)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACES                                    │
├─────────────────┬─────────────────────┬─────────────────────────────────────┤
│   WEB PANEL     │   TELEGRAM BOT      │          REST API                   │
│   (React/Next)  │   (Grammy)          │          (Hono)                     │
│                 │                     │                                     │
│  • Dashboard    │  • /swap commands   │  • GET /quote                       │
│  • Portfolio    │  • Inline menus     │  • POST /swap/build                 │
│  • Analytics    │  • Notifications    │  • WebSocket streams                │
│  • Settings     │  • Quick trades     │  • API keys & rate limits           │
└────────┬────────┴──────────┬──────────┴──────────────────┬──────────────────┘
         │                   │                             │
         └───────────────────┴──────────────┬──────────────┘
                                            │
┌───────────────────────────────────────────▼─────────────────────────────────┐
│                         UNIFIED BACKEND SERVICE                              │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Auth      │  │   Trading   │  │  Portfolio  │  │  Analytics  │        │
│  │   Service   │  │   Engine    │  │   Tracker   │  │   Engine    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Queue     │  │   Price     │  │  Referral   │  │   Alerts    │        │
│  │   (BullMQ)  │  │   Oracle    │  │   System    │  │   Service   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└───────────────────────────────────────────┬─────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼─────────────────────────────────┐
│                          CHAIN ADAPTER LAYER                                 │
│                                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │   TON   │ │  EVM    │ │   SUI   │ │ ECLIPSE │ │  HYPER  │ │ COSMOS  │  │
│  │ Adapter │ │ Adapter │ │ Adapter │ │ Adapter │ │ LIQUID  │ │ Adapter │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
└───────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────────┘
        │          │          │          │          │          │
┌───────▼──────────▼──────────▼──────────▼──────────▼──────────▼───────────┐
│                        ON-CHAIN SMART CONTRACTS                           │
│                                                                           │
│  Per Chain:                                                               │
│  • FeeCollector.sol   - Transparent fee collection                        │
│  • SwapRouter.sol     - Unified swap interface                            │
│  • ReferralRegistry   - On-chain referral tracking                        │
│  • Analytics.sol      - Volume/user tracking (optional)                   │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Work Breakdown Structure

### Phase 1: Foundation (Week 1)
| Task ID | Task | Owner | Dependencies | Status |
|---------|------|-------|--------------|--------|
| F-001 | Core Types & Interfaces | Agent A | None | 🔴 Not Started |
| F-002 | Database Schema (Prisma) | Agent A | F-001 | 🔴 Not Started |
| F-003 | Authentication System | Agent B | F-001 | 🔴 Not Started |
| F-004 | Base Adapter Implementation | Agent A | F-001 | 🔴 Not Started |
| F-005 | TON Adapter | Agent C | F-004 | 🔴 Not Started |
| F-006 | EVM Adapter (Generic) | Agent C | F-004 | 🔴 Not Started |

### Phase 2: Interfaces (Week 2)
| Task ID | Task | Owner | Dependencies | Status |
|---------|------|-------|--------------|--------|
| I-001 | REST API Core | Agent B | F-003 | 🔴 Not Started |
| I-002 | Telegram Bot Core | Agent D | F-003 | 🔴 Not Started |
| I-003 | Web Panel Setup (Next.js) | Agent E | F-003 | 🔴 Not Started |
| I-004 | WebSocket Server | Agent B | I-001 | 🔴 Not Started |
| I-005 | API Documentation (OpenAPI) | Agent B | I-001 | 🔴 Not Started |

### Phase 3: Smart Contracts (Week 2-3)
| Task ID | Task | Owner | Dependencies | Status |
|---------|------|-------|--------------|--------|
| S-001 | FeeCollector Contract | Agent F | None | 🔴 Not Started |
| S-002 | SwapRouter Contract | Agent F | S-001 | 🔴 Not Started |
| S-003 | ReferralRegistry Contract | Agent F | S-001 | 🔴 Not Started |
| S-004 | Contract Deployment Scripts | Agent F | S-001,S-002,S-003 | 🔴 Not Started |
| S-005 | TON Contract (FunC) | Agent G | None | 🔴 Not Started |

### Phase 4: Integration (Week 3)
| Task ID | Task | Owner | Dependencies | Status |
|---------|------|-------|--------------|--------|
| INT-001 | Web Panel ↔ API Integration | Agent E | I-001, I-003 | 🔴 Not Started |
| INT-002 | Telegram ↔ API Integration | Agent D | I-001, I-002 | 🔴 Not Started |
| INT-003 | Contract Integration | Agent C | S-004, F-005 | 🔴 Not Started |
| INT-004 | Price Oracle Integration | Agent A | F-004 | 🔴 Not Started |

### Phase 5: Polish & Launch (Week 4)
| Task ID | Task | Owner | Dependencies | Status |
|---------|------|-------|--------------|--------|
| P-001 | Testing Suite | Agent A | All | 🔴 Not Started |
| P-002 | Security Audit Prep | Agent F | S-001-S-005 | 🔴 Not Started |
| P-003 | Documentation | Agent B | All | 🔴 Not Started |
| P-004 | Grant Applications | Human | P-003 | 🔴 Not Started |
| P-005 | Beta Launch | All | All | 🔴 Not Started |

---

## 💰 Business Model

### Pricing Tiers (Profit-Share)

| Tier | Requirement | Profit Share | Rationale |
|------|-------------|--------------|-----------|
| 🆓 Free | None | 15% of profits | Zero friction acquisition |
| 💎 Holder | 1,000 $HOPPER | 10% of profits | Token demand driver |
| 🔥 Staker | 10,000 veHOPPER | 5% of profits | Deep alignment |
| 🏢 Enterprise | Custom deal | 2-5% of profits | B2B revenue |

**Why 15% works**: dHEDGE/Enzyme charge 10-20% performance fees. We're in range, but positioned as "free" since most trades lose money.

### Referral Program (Competitive with Trojan's $65.8M payouts)

| Tier | Weekly Volume | Referrer Share | Referee Discount |
|------|---------------|----------------|------------------|
| Bronze | < $10K | 20% of fees | 5% off |
| Silver | $10K-50K | 25% of fees | 7.5% off |
| Gold | $50K-200K | 30% of fees | 10% off |
| Diamond | > $200K | 35% of fees | 10% off |

### $HOPPER Token Economics

**Lessons from competitors**:
- ✅ Banana Gun: 40% revenue share, 0% token tax → sustainable
- ❌ Unibot: 79.9% revenue from token tax → collapsed 98.5%
- ✅ BONKbot: 100% fees → token burn → ecosystem alignment

**Our model**:
- 40% of protocol fees → veHOPPER stakers (industry standard)
- 0% token trading tax (Banana Gun model)
- Quarterly buyback + burn from treasury
- 4-year vesting for team (Banana Gun's 5yr cliff proved credibility)

---

## 🎯 Success Criteria

### Technical
- [ ] All 3 interfaces (Web, Telegram, API) functional
- [ ] 8+ chains supported at launch (prioritize: Sonic, Kaia, Berachain, Sui)
- [ ] < 500ms quote response time
- [ ] Smart contracts deployed on TON + 3 EVM chains
- [ ] 99.9% uptime in testing
- [ ] Public API with rate limiting and documentation

### Business
- [ ] 5+ grant applications submitted (target $100K+ non-dilutive)
- [ ] 500 beta users onboarded (Trojan had $36M volume day 1)
- [ ] $100K volume in first week
- [ ] 50+ referral signups
- [ ] Points program live before token launch

### Security (Critical - all 3 major competitors were exploited)
- [ ] No private key storage (non-custodial)
- [ ] Smart contract audit (at least Slither + Mythril)
- [ ] Rate limiting on all endpoints
- [ ] Rug detection integration (target 90%+ accuracy)

### Grant Appeal
- [ ] On-chain fee transparency (all fees verifiable)
- [ ] Open source contracts
- [ ] Multi-chain interoperability demo
- [ ] User acquisition metrics dashboard
- [ ] Profit-share model as novel mechanism

---

## 🔧 Technical Standards

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- 80%+ test coverage for core modules

### API Design
- RESTful with OpenAPI 3.0 spec
- Consistent error responses
- Rate limiting per API key
- Request/response logging

### Smart Contracts
- Solidity 0.8.20+ for EVM
- FunC for TON
- Move for Sui (Phase 2)
- Full NatSpec documentation
- Slither + Mythril analysis

### Security
- No private keys in code
- Environment variables for secrets
- JWT + API key authentication
- Input validation on all endpoints

---

## 📁 Repository Structure

```
chainhopper/
├── apps/
│   ├── web/                 # Next.js web panel
│   ├── bot/                 # Telegram bot
│   └── api/                 # REST API server
├── packages/
│   ├── core/                # Shared business logic
│   ├── adapters/            # Chain adapters
│   ├── contracts/           # Smart contracts
│   ├── types/               # Shared TypeScript types
│   └── ui/                  # Shared UI components
├── docs/
│   ├── ORCHESTRATION.md     # This file
│   ├── agents/              # Agent-specific docs
│   │   ├── AGENT_A_CORE.md
│   │   ├── AGENT_B_API.md
│   │   ├── AGENT_C_ADAPTERS.md
│   │   ├── AGENT_D_TELEGRAM.md
│   │   ├── AGENT_E_WEB.md
│   │   └── AGENT_F_CONTRACTS.md
│   ├── api/                 # API documentation
│   └── grants/              # Grant application materials
├── scripts/
│   ├── deploy/              # Deployment scripts
│   └── setup/               # Setup scripts
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🤝 Agent Coordination Protocol

### Communication
1. All agents read this ORCHESTRATION.md before starting
2. Update task status in this document
3. Document blockers immediately
4. Cross-reference other agent docs when needed

### Handoff Protocol
1. Complete your task
2. Update status to ✅ Complete
3. Document any deviations from spec
4. Note integration points for dependent tasks
5. Tag next agent in handoff notes

### Conflict Resolution
1. Check ORCHESTRATION.md for authoritative spec
2. If unclear, default to simplest implementation
3. Document decision and rationale
4. Flag for human review if major deviation

---

## 📊 Key Metrics to Track

### Development
- Tasks completed per week
- Blockers encountered
- Integration issues

### Technical
- API response times
- Transaction success rate
- Error rates by chain

### Business
- User signups
- Volume processed
- Fee revenue
- Grant application status

---

## 🚨 Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Security exploit** | Medium | Critical | All 3 major competitors hacked ($500K-$3M each). Non-custodial design, audit, no private key storage |
| Chain RPC downtime | Medium | High | Multiple RPC fallbacks per chain |
| Smart contract bug | Low | Critical | Audit + bug bounty + timelock on admin functions |
| Grant rejection | Medium | Medium | Apply to 5+ programs across different chains |
| Competitor copies model | Medium | Low | Speed to market + multi-chain moat |
| TON volume too low | Medium | Medium | TonTradingBot shut down for this reason. Don't over-invest in TON |
| Regulatory issues | Low | High | Non-custodial design, no token custody |
| Oracle manipulation | Low | High | Use Chainlink/Pyth, not DEX spot prices for P&L |
| Telegram phishing | High | Medium | 2000% increase in 2024. Clear warnings, no DM support |

---

## 📈 Go-To-Market Strategy

### Phase 1: Launch (Week 1-2)
**Target: Sonic, Kaia, Berachain** (zero competition)
- Deploy contracts on testnets
- Soft launch with 50 beta testers
- Apply to chain-specific grants immediately

### Phase 2: Growth (Week 3-4)
**Target: 500 users, $100K volume**
- Points program announcement (pre-token hype)
- KOL partnerships ($3-7K budget)
- Alpha caller revenue share deals
- Telegram group building

### Phase 3: Token (Week 5-8)
**Target: TGE with $1M+ volume**
- Points → $HOPPER conversion
- veHOPPER staking launch
- 40% revenue share activated
- Expansion to Solana (compete directly)

### Marketing Budget Benchmarks (from competitor analysis)
| Phase | Budget | Tactics |
|-------|--------|---------|
| Launch | $3-7K/mo | 2-3 niche KOLs, Telegram groups |
| Growth | $10-25K/mo | Mid-tier influencers, community |
| Scale | $30-50K/mo | Premium KOLs, multi-platform |

**Key insight**: Telegram KOL partnerships show 40% higher conversion than other channels.

---

## 📅 Milestones

| Date | Milestone | Deliverables |
|------|-----------|--------------|
| Week 1 End | Alpha | Core + TON + 1 EVM chain working |
| Week 2 End | Beta | All interfaces + 4 chains |
| Week 3 End | RC1 | Contracts deployed + 8 chains |
| Week 4 End | Launch | Public beta + grant submissions |

---

## 📞 Escalation Path

1. **Technical Blockers**: Document in task, continue with next task
2. **Spec Ambiguity**: Make reasonable assumption, document decision
3. **Critical Issues**: Flag immediately with `🚨 CRITICAL` tag
4. **Cross-Agent Dependencies**: Tag dependent agent, don't block

---

*This document is the single source of truth. All agents should sync with this before and after each work session.*
