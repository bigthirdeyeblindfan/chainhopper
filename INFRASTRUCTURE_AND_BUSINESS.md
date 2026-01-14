# Infrastructure & Business Model Deep Dive

## Executive Summary: Competitive Context

The Telegram trading bot market processes **$70M+ daily volume** with **$33B+ in 2024**. Key findings from competitive analysis:

### Market Structure
- **Trojan** leads by lifetime volume ($25B+, 2M users) but **Axiom** captured 57% market share in just 5 months
- **All competitors charge flat 0.5-1% fees** regardless of trade outcome
- **No one has tried profit-share** (our key differentiator)
- **Solana dominates 70%+** but emerging chains have zero bot infrastructure

### Security is Critical
All three major EVM bots were exploited in 2023-2024:
- Maestro: $500K (router vulnerability)
- Unibot: $640K (call injection) - token crashed 42%
- Banana Gun: $3M (Telegram message oracle)

**Our response**: Non-custodial design, no private key storage, mandatory audits.

### Token Economics That Work
- ✅ **Banana Gun**: 40% revenue share, 0% token tax → $60M annual distribution
- ❌ **Unibot**: 79.9% revenue from token tax → collapsed 98.5%
- ✅ **BONKbot**: 100% fees → BONK burn → ecosystem alignment

---

## Part 1: Infrastructure Reality Check

### RPC Providers - What We Actually Need

**Free RPCs are useless because:**
- Rate limited (10-100 req/min typical)
- No SLA, random downtime
- Slow response times (500ms+)
- First to be cut when chain is congested
- No websocket support usually

**What production trading bots need:**
- 1000+ req/min minimum
- <100ms response times
- 99.9%+ uptime
- Websocket for real-time
- Archive node access for historical data
- Multiple regions for redundancy

---

### RPC Provider Comparison

| Provider | Chains | Pricing | Notes |
|----------|--------|---------|-------|
| **Alchemy** | EVM (10+) | $49-399/mo | Best EVM, no TON/Sui |
| **QuickNode** | 25+ chains | $49-299/mo | Good coverage, expensive at scale |
| **Infura** | EVM only | $50-225/mo | Reliable but limited chains |
| **Chainstack** | 30+ chains | $49-349/mo | Good multi-chain, includes TON |
| **dRPC** | 50+ chains | Pay-per-use ~$0.50/M | Decentralized, cheapest at scale |
| **Blast API** | 40+ chains | Free tier + $12/M req | Good starter option |
| **GetBlock** | 50+ chains | $29-299/mo | Budget option, includes TON |
| **NOWNodes** | 40+ chains | $20-500/mo | Cheapest with good coverage |

**Chain-Specific:**
| Chain | Best Provider | Cost | Notes |
|-------|---------------|------|-------|
| TON | Toncenter Pro | $50/mo | Only real option at scale |
| TON | GetBlock | $29/mo | Backup option |
| Sui | Shinami | Free-$99/mo | Native Sui provider |
| Sui | QuickNode | $49/mo | Alternative |
| Sonic | Official/Alchemy | TBD | New chain, limited options |
| Kaia | Official | Free w/ limits | Run own node likely |
| Hyperliquid | Official only | Free | Only option |

---

### Recommended Infrastructure Stack

**Phase 1 (Launch - 1K users): ~$200/mo**
```
├── RPCs
│   ├── dRPC (pay-per-use) - All EVM chains - ~$50/mo
│   ├── Toncenter Pro - TON - $50/mo
│   └── Shinami - Sui - Free tier
├── Database
│   ├── PlanetScale (MySQL) - Free-$29/mo
│   └── Upstash Redis - Free-$10/mo
├── Hosting
│   ├── Railway/Render - $20/mo
│   └── Vercel (web) - Free
└── Total: ~$150-200/mo
```

**Phase 2 (1K-10K users): ~$500-1000/mo**
```
├── RPCs
│   ├── QuickNode Growth - $299/mo (multiple chains)
│   ├── Toncenter Pro - $50/mo
│   └── Shinami Pro - $99/mo
├── Database
│   ├── PlanetScale Scaler - $29/mo
│   └── Upstash Pro - $50/mo
├── Hosting
│   ├── AWS/GCP - $100-200/mo
│   └── Vercel Pro - $20/mo
└── Total: ~$650-750/mo
```

**Phase 3 (10K+ users): ~$2000-5000/mo**
```
├── RPCs
│   ├── Dedicated nodes (critical chains) - $500-1000/mo
│   ├── QuickNode Enterprise - $500/mo
│   └── Backup providers - $200/mo
├── Database
│   ├── Managed PostgreSQL - $200/mo
│   └── Redis Cluster - $100/mo
├── Hosting
│   ├── Kubernetes cluster - $500-1000/mo
│   └── CDN/Edge - $100/mo
└── Total: ~$2000-3000/mo
```

---

## Part 2: Business Model - "Free to Use, Pay on Wins"

### The Model

**Core Concept:**
- $0 upfront cost to users
- $0 fee on losing trades
- X% fee ONLY on profitable trades
- Fee taken from the profit, not principal

**Example:**
```
User swaps 100 USDT → Token X
Token X goes up 50%
User swaps Token X → 150 USDT

Profit: 50 USDT
Platform fee (10% of profit): 5 USDT
User receives: 145 USDT

If Token X went DOWN:
User swaps Token X → 80 USDT
Platform fee: $0
User receives: 80 USDT
```

---

### Implementation via Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProfitShareVault
 * @notice Tracks user positions and takes fees only on profitable exits
 * @dev Users deposit through this contract, we track cost basis
 */
contract ProfitShareVault {
    
    struct Position {
        address token;
        uint256 costBasis;      // Total USD value when acquired
        uint256 tokenAmount;    // Amount of tokens held
        uint256 entryTime;      // When position opened
    }
    
    // Profit share configuration
    uint256 public profitShareBps = 1000; // 10% of profits
    uint256 public minProfitForFee = 1e6; // $1 minimum profit to charge fee
    
    // User positions: user => token => Position
    mapping(address => mapping(address => Position)) public positions;
    
    // Price oracle for USD values
    IPriceOracle public oracle;
    
    // Events
    event PositionOpened(address indexed user, address indexed token, uint256 amount, uint256 costBasis);
    event PositionClosed(address indexed user, address indexed token, uint256 profit, uint256 fee);
    event ProfitShareCollected(address indexed user, uint256 amount);
    
    /**
     * @notice Execute swap and track position
     * @dev Called instead of direct DEX interaction
     */
    function swapAndTrack(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata swapData
    ) external returns (uint256 amountOut) {
        // Get current position in tokenIn
        Position storage posIn = positions[msg.sender][tokenIn];
        
        // Calculate proportion of position being sold
        uint256 proportionSold = posIn.tokenAmount > 0 
            ? (amountIn * 1e18) / posIn.tokenAmount 
            : 0;
        
        // Calculate cost basis for this sale
        uint256 costBasisSold = (posIn.costBasis * proportionSold) / 1e18;
        
        // Execute the swap through DEX
        amountOut = _executeSwap(tokenIn, tokenOut, amountIn, minAmountOut, swapData);
        
        // Get USD value of output
        uint256 valueOut = oracle.getValueUSD(tokenOut, amountOut);
        
        // Calculate profit/loss
        uint256 fee = 0;
        if (valueOut > costBasisSold + minProfitForFee) {
            uint256 profit = valueOut - costBasisSold;
            fee = (profit * profitShareBps) / 10000;
            
            // Take fee in output token
            uint256 feeTokens = (amountOut * fee) / valueOut;
            amountOut -= feeTokens;
            
            emit ProfitShareCollected(msg.sender, fee);
        }
        
        // Update positions
        _updatePosition(msg.sender, tokenIn, posIn.tokenAmount - amountIn, posIn.costBasis - costBasisSold);
        _updatePosition(msg.sender, tokenOut, 
            positions[msg.sender][tokenOut].tokenAmount + amountOut,
            positions[msg.sender][tokenOut].costBasis + (valueOut - fee)
        );
        
        emit PositionClosed(msg.sender, tokenIn, valueOut > costBasisSold ? valueOut - costBasisSold : 0, fee);
    }
    
    /**
     * @notice Deposit tokens and establish cost basis
     */
    function deposit(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        uint256 valueUSD = oracle.getValueUSD(token, amount);
        Position storage pos = positions[msg.sender][token];
        
        pos.tokenAmount += amount;
        pos.costBasis += valueUSD;
        pos.entryTime = block.timestamp;
        
        emit PositionOpened(msg.sender, token, amount, valueUSD);
    }
    
    /**
     * @notice Withdraw without swap (no fee if just withdrawing)
     */
    function withdraw(address token, uint256 amount) external {
        Position storage pos = positions[msg.sender][token];
        require(pos.tokenAmount >= amount, "Insufficient balance");
        
        uint256 proportionWithdrawn = (amount * 1e18) / pos.tokenAmount;
        uint256 costBasisWithdrawn = (pos.costBasis * proportionWithdrawn) / 1e18;
        
        pos.tokenAmount -= amount;
        pos.costBasis -= costBasisWithdrawn;
        
        IERC20(token).transfer(msg.sender, amount);
    }
    
    /**
     * @notice Get user's unrealized P&L
     */
    function getUnrealizedPnL(address user, address token) external view returns (
        int256 pnl,
        uint256 currentValue,
        uint256 costBasis
    ) {
        Position memory pos = positions[user][token];
        currentValue = oracle.getValueUSD(token, pos.tokenAmount);
        costBasis = pos.costBasis;
        pnl = int256(currentValue) - int256(costBasis);
    }
}
```

---

### Profitability Analysis

**Assumptions:**
- Average user makes 10 trades/month
- Average trade size: $500
- Win rate: 40% (realistic for retail)
- Average win: +30%
- Average loss: -20%
- Profit share: 10%

**Per 100 Users/Month:**
```
Trades: 100 users × 10 trades = 1,000 trades
Volume: 1,000 × $500 = $500,000

Winning trades: 400 (40%)
Average profit per win: $500 × 30% = $150
Total profits: 400 × $150 = $60,000

Platform revenue (10%): $6,000/month per 100 users

Losing trades: 600 (60%)
Platform revenue from losses: $0

Net revenue: $6,000/month per 100 users = $60/user/month
```

**At Scale:**
| Users | Monthly Volume | User Profits | Platform Revenue |
|-------|----------------|--------------|------------------|
| 100 | $500K | $60K | $6K |
| 1,000 | $5M | $600K | $60K |
| 10,000 | $50M | $6M | $600K |
| 100,000 | $500M | $60M | $6M |

---

### Comparison with Traditional Fee Model

**Traditional (0.5% per trade):**
```
1,000 trades × $500 × 0.5% = $2,500/month per 100 users
```

**Profit Share (10% of wins):**
```
$6,000/month per 100 users (2.4x more revenue)
```

**Why Profit Share Wins:**
1. Higher revenue per user
2. Zero friction to start (no upfront cost)
3. Aligned incentives (we only make money when users do)
4. Users feel "free" even though we make more

---

### Pros & Cons

**PROS:**
1. **User Acquisition**: "Free trading" is insane marketing
2. **Retention**: Users don't leave because of fees
3. **Aligned Incentives**: We want users to profit
4. **Higher Revenue**: 2-3x vs flat fee model
5. **Psychological**: Users pay from "house money" (profits)
6. **Differentiation**: No one else does this in trading bots
7. **Grant Appeal**: Novel mechanism, on-chain transparency

**CONS:**
1. **Complexity**: Need to track cost basis accurately
2. **Oracle Risk**: Bad price data = wrong fees
3. **Capital Efficiency**: Users must route through our contracts
4. **MEV/Frontrunning**: More visible transactions
5. **Tax Complexity**: Users need to track cost basis too
6. **Delayed Revenue**: Only collect when users exit profitably
7. **Gaming**: Users could try to manipulate cost basis

**MITIGATIONS:**
- Use Chainlink/Pyth for oracles (hardest to manipulate)
- Minimum profit threshold ($1) to avoid dust abuse
- Time-weighted average for cost basis
- Optional: small base fee (0.1%) + profit share for sustainability

---

## Part 3: Utility Token Economics

### Token: $HOPPER

**Why Launch a Token:**
1. **Grants love tokens**: Shows long-term ecosystem commitment
2. **User incentives**: Reward early adopters
3. **Fee discounts**: Create demand
4. **Governance**: Decentralization narrative
5. **Treasury**: Protocol-owned liquidity
6. **Fundraising**: If needed later

---

### Token Utility

```
┌─────────────────────────────────────────────────────────────┐
│                    $HOPPER UTILITY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. FEE REDUCTION                                           │
│     ├── Hold 100 $HOPPER → 10% off profit share            │
│     ├── Hold 1,000 $HOPPER → 25% off profit share          │
│     ├── Hold 10,000 $HOPPER → 50% off profit share         │
│     └── Stake $HOPPER → Additional discounts               │
│                                                             │
│  2. STAKING REWARDS                                         │
│     ├── Stake $HOPPER → Earn % of protocol fees            │
│     ├── veHOPPER model (vote-escrow)                       │
│     └── Longer lock → Higher rewards                       │
│                                                             │
│  3. GOVERNANCE                                              │
│     ├── Vote on fee parameters                              │
│     ├── Vote on new chain integrations                      │
│     └── Vote on treasury allocation                         │
│                                                             │
│  4. ACCESS                                                  │
│     ├── Hold to access premium features                     │
│     ├── Priority support                                    │
│     └── Early access to new chains                          │
│                                                             │
│  5. REFERRAL BOOST                                          │
│     ├── Hold $HOPPER → Higher referral %                   │
│     └── Referral rewards paid in $HOPPER                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Token Distribution

```
Total Supply: 1,000,000,000 $HOPPER

┌────────────────────────────────────────────────────────┐
│ Community & Ecosystem     40%   400,000,000           │
│ ├── Trading rewards       15%   (emissions over 4yr)  │
│ ├── Liquidity mining      10%   (LP incentives)       │
│ ├── Airdrops              5%    (early users)         │
│ ├── Grants received       5%    (if tokens from grants)│
│ └── Community treasury    5%    (DAO controlled)      │
├────────────────────────────────────────────────────────┤
│ Team & Contributors       20%   200,000,000           │
│ ├── Core team            15%    (4yr vest, 1yr cliff) │
│ └── Future contributors   5%    (hiring pool)         │
├────────────────────────────────────────────────────────┤
│ Treasury                  20%   200,000,000           │
│ ├── Protocol owned liq   10%    (POL)                 │
│ ├── Strategic reserve     5%    (partnerships)        │
│ └── Insurance fund        5%    (black swan events)   │
├────────────────────────────────────────────────────────┤
│ Investors (if needed)     15%   150,000,000           │
│ ├── Seed round            5%    (2yr vest, 6mo cliff) │
│ └── Future rounds        10%    (reserved)            │
├────────────────────────────────────────────────────────┤
│ Initial Liquidity         5%    50,000,000            │
│ └── DEX liquidity         5%    (launch pools)        │
└────────────────────────────────────────────────────────┘
```

---

### Launch Strategy

**Phase 1: Points Program (Pre-Token)**
```
Week 1-4: Launch trading bot
- Users earn "points" for trading
- Points convert to $HOPPER at TGE
- Creates engagement without token risk

Point earning:
- 1 point per $100 traded
- 2x points for multi-chain usage
- 5x points for referrals
- Bonus points for early adopters
```

**Phase 2: Token Generation Event (TGE)**
```
Month 2-3: Launch $HOPPER

1. Deploy token contracts (EVM + TON)
2. Convert points → $HOPPER
3. Initial DEX Offering (IDO) on major chain
4. Liquidity bootstrapping (Balancer LBP or similar)
5. CEX listings (tier 2-3 initially)
```

**Phase 3: Ecosystem Expansion**
```
Month 3+: Build utility

1. Enable fee discounts for holders
2. Launch staking
3. Governance activation
4. Cross-chain bridging
5. Partnership integrations
```

---

### Token Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HopperToken
 * @notice Governance and utility token for ChainHopper protocol
 */
contract HopperToken is ERC20, ERC20Burnable, ERC20Votes, Ownable {
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;
    
    // Vesting
    mapping(address => VestingSchedule) public vestingSchedules;
    
    struct VestingSchedule {
        uint256 total;
        uint256 released;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
    }
    
    constructor() ERC20("ChainHopper", "HOPPER") ERC20Permit("ChainHopper") Ownable(msg.sender) {
        // Initial mint to treasury (for distribution)
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    /**
     * @notice Create vesting schedule for team/investors
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external onlyOwner {
        require(vestingSchedules[beneficiary].total == 0, "Schedule exists");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            total: amount,
            released: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration
        });
        
        transfer(address(this), amount);
    }
    
    /**
     * @notice Release vested tokens
     */
    function releaseVested() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.total > 0, "No vesting schedule");
        
        uint256 releasable = _vestedAmount(schedule) - schedule.released;
        require(releasable > 0, "Nothing to release");
        
        schedule.released += releasable;
        _transfer(address(this), msg.sender, releasable);
    }
    
    function _vestedAmount(VestingSchedule memory schedule) internal view returns (uint256) {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }
        
        uint256 timeFromStart = block.timestamp - schedule.startTime;
        if (timeFromStart >= schedule.vestingDuration) {
            return schedule.total;
        }
        
        return (schedule.total * timeFromStart) / schedule.vestingDuration;
    }
    
    // Required overrides
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }
    
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
```

---

### Staking Contract (veHOPPER Model)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title veHopper
 * @notice Vote-escrow staking for $HOPPER
 * @dev Lock HOPPER → Get veHOPPER (non-transferable)
 *      Longer lock = more veHOPPER = more rewards + voting power
 */
contract veHopper {
    
    IERC20 public immutable hopper;
    
    struct Lock {
        uint256 amount;
        uint256 unlockTime;
    }
    
    mapping(address => Lock) public locks;
    
    uint256 public constant MAX_LOCK_TIME = 4 * 365 days; // 4 years
    uint256 public constant MIN_LOCK_TIME = 7 days;
    
    // Fee distribution
    uint256 public totalFeesCollected;
    mapping(address => uint256) public userFeesClaimed;
    
    event Locked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unlocked(address indexed user, uint256 amount);
    event FeesClaimed(address indexed user, uint256 amount);
    
    constructor(address _hopper) {
        hopper = IERC20(_hopper);
    }
    
    /**
     * @notice Lock HOPPER for veHOPPER
     * @param amount Amount to lock
     * @param lockTime Lock duration in seconds
     */
    function lock(uint256 amount, uint256 lockTime) external {
        require(lockTime >= MIN_LOCK_TIME && lockTime <= MAX_LOCK_TIME, "Invalid lock time");
        
        Lock storage userLock = locks[msg.sender];
        
        // If extending, new unlock must be >= current
        uint256 newUnlockTime = block.timestamp + lockTime;
        if (userLock.amount > 0) {
            require(newUnlockTime >= userLock.unlockTime, "Can only extend lock");
        }
        
        hopper.transferFrom(msg.sender, address(this), amount);
        
        userLock.amount += amount;
        userLock.unlockTime = newUnlockTime;
        
        emit Locked(msg.sender, amount, newUnlockTime);
    }
    
    /**
     * @notice Get veHOPPER balance (voting power)
     * @dev Linear decay: balance = locked * (timeRemaining / maxLockTime)
     */
    function balanceOf(address user) public view returns (uint256) {
        Lock memory userLock = locks[user];
        if (userLock.amount == 0 || block.timestamp >= userLock.unlockTime) {
            return 0;
        }
        
        uint256 timeRemaining = userLock.unlockTime - block.timestamp;
        return (userLock.amount * timeRemaining) / MAX_LOCK_TIME;
    }
    
    /**
     * @notice Withdraw after lock expires
     */
    function withdraw() external {
        Lock storage userLock = locks[msg.sender];
        require(userLock.amount > 0, "No lock");
        require(block.timestamp >= userLock.unlockTime, "Still locked");
        
        uint256 amount = userLock.amount;
        userLock.amount = 0;
        
        hopper.transfer(msg.sender, amount);
        emit Unlocked(msg.sender, amount);
    }
    
    /**
     * @notice Claim share of protocol fees
     */
    function claimFees() external {
        uint256 userShare = _pendingFees(msg.sender);
        require(userShare > 0, "No fees to claim");
        
        userFeesClaimed[msg.sender] = totalFeesCollected;
        
        // Transfer fees (in ETH or stablecoin)
        payable(msg.sender).transfer(userShare);
        
        emit FeesClaimed(msg.sender, userShare);
    }
    
    function _pendingFees(address user) internal view returns (uint256) {
        uint256 newFees = totalFeesCollected - userFeesClaimed[user];
        if (newFees == 0) return 0;
        
        uint256 userVeBalance = balanceOf(user);
        uint256 totalVeSupply = _totalVeSupply();
        
        if (totalVeSupply == 0) return 0;
        
        return (newFees * userVeBalance) / totalVeSupply;
    }
    
    function _totalVeSupply() internal view returns (uint256) {
        // In production: track this incrementally
        // Simplified for example
        return 0;
    }
    
    // Receive ETH for fee distribution
    receive() external payable {
        totalFeesCollected += msg.value;
    }
}
```

---

## Part 4: Revised Pricing Tiers

### Tier Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRICING TIERS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🆓 FREE TIER                                                           │
│  ├── Cost: $0                                                           │
│  ├── Profit Share: 15% of trading profits                               │
│  ├── Features: All basic features                                       │
│  ├── Chains: All supported                                              │
│  ├── Rate Limit: 60 API calls/min                                       │
│  └── Support: Community Discord                                         │
│                                                                          │
│  💎 HOPPER HOLDER                                                       │
│  ├── Cost: Hold 1,000+ $HOPPER                                         │
│  ├── Profit Share: 10% of profits (33% discount)                        │
│  ├── Features: All features + priority execution                        │
│  ├── Rate Limit: 300 API calls/min                                      │
│  └── Support: Priority Discord                                          │
│                                                                          │
│  🔥 HOPPER STAKER                                                       │
│  ├── Cost: Stake 10,000+ $HOPPER (veHOPPER)                            │
│  ├── Profit Share: 5% of profits (67% discount)                         │
│  ├── Features: All features + early access                              │
│  ├── Rate Limit: 1000 API calls/min                                     │
│  ├── Bonus: Earn protocol fees in proportion to stake                   │
│  └── Support: Direct support channel                                    │
│                                                                          │
│  🏢 ENTERPRISE                                                          │
│  ├── Cost: Custom ($500-5000/mo)                                        │
│  ├── Profit Share: 2-5% negotiable                                      │
│  ├── Features: White-label, custom integrations                         │
│  ├── Rate Limit: Unlimited                                              │
│  ├── SLA: 99.9% uptime guarantee                                        │
│  └── Support: Dedicated account manager                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Smart Contract Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TieredProfitShare
 * @notice Implements tiered profit sharing based on $HOPPER holdings/staking
 */
contract TieredProfitShare {
    
    IERC20 public hopper;
    IveHopper public veHopper;
    
    // Tier thresholds
    uint256 public constant HOLDER_THRESHOLD = 1_000 * 1e18;    // 1,000 HOPPER
    uint256 public constant STAKER_THRESHOLD = 10_000 * 1e18;   // 10,000 veHOPPER
    
    // Profit share rates (basis points)
    uint256 public constant FREE_TIER_BPS = 1500;      // 15%
    uint256 public constant HOLDER_TIER_BPS = 1000;    // 10%
    uint256 public constant STAKER_TIER_BPS = 500;     // 5%
    uint256 public constant ENTERPRISE_BPS = 200;      // 2% (minimum)
    
    // Enterprise accounts (custom rates)
    mapping(address => uint256) public enterpriseRates;
    mapping(address => bool) public isEnterprise;
    
    enum Tier { Free, Holder, Staker, Enterprise }
    
    /**
     * @notice Get user's current tier
     */
    function getUserTier(address user) public view returns (Tier) {
        if (isEnterprise[user]) {
            return Tier.Enterprise;
        }
        
        uint256 veBalance = veHopper.balanceOf(user);
        if (veBalance >= STAKER_THRESHOLD) {
            return Tier.Staker;
        }
        
        uint256 hopperBalance = hopper.balanceOf(user);
        if (hopperBalance >= HOLDER_THRESHOLD) {
            return Tier.Holder;
        }
        
        return Tier.Free;
    }
    
    /**
     * @notice Get profit share rate for user
     */
    function getProfitShareRate(address user) public view returns (uint256) {
        Tier tier = getUserTier(user);
        
        if (tier == Tier.Enterprise) {
            return enterpriseRates[user];
        } else if (tier == Tier.Staker) {
            return STAKER_TIER_BPS;
        } else if (tier == Tier.Holder) {
            return HOLDER_TIER_BPS;
        } else {
            return FREE_TIER_BPS;
        }
    }
    
    /**
     * @notice Calculate fee for a profitable trade
     * @param user The trader
     * @param profit The profit amount in USD (scaled by 1e6)
     * @return fee The fee to collect
     */
    function calculateFee(address user, uint256 profit) external view returns (uint256 fee) {
        uint256 rateBps = getProfitShareRate(user);
        fee = (profit * rateBps) / 10000;
    }
    
    /**
     * @notice Set enterprise rate (admin only)
     */
    function setEnterpriseRate(address user, uint256 rateBps) external onlyOwner {
        require(rateBps >= ENTERPRISE_BPS, "Rate too low");
        require(rateBps <= FREE_TIER_BPS, "Rate too high");
        
        isEnterprise[user] = true;
        enterpriseRates[user] = rateBps;
    }
}
```

---

## Part 5: Complete Revenue Model

### Revenue Streams

```
┌─────────────────────────────────────────────────────────────┐
│                    REVENUE STREAMS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PROFIT SHARE (Primary)          ~70% of revenue         │
│     └── 5-15% of user trading profits                       │
│                                                              │
│  2. ENTERPRISE SUBSCRIPTIONS        ~15% of revenue         │
│     └── $500-5000/mo for white-label, API access            │
│                                                              │
│  3. TOKEN ECONOMICS                 ~10% of revenue         │
│     ├── Initial token sale (if any)                         │
│     ├── Protocol-owned liquidity yields                     │
│     └── Treasury management                                 │
│                                                              │
│  4. GRANTS                          ~5% of revenue          │
│     └── Ecosystem grants (non-dilutive)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Projected Financials

**Year 1 Projections:**

| Quarter | Users | Volume | Profits Generated | Platform Revenue | Grants |
|---------|-------|--------|-------------------|------------------|--------|
| Q1 | 500 | $2.5M | $200K | $20K | $50K |
| Q2 | 2,000 | $15M | $1.5M | $150K | $100K |
| Q3 | 5,000 | $50M | $5M | $500K | $50K |
| Q4 | 10,000 | $100M | $10M | $1M | $0 |
| **Total** | - | $167.5M | $16.7M | **$1.67M** | **$200K** |

**Costs Year 1:**
| Item | Q1 | Q2 | Q3 | Q4 | Total |
|------|-----|-----|-----|-----|-------|
| Infrastructure | $1K | $3K | $10K | $25K | $39K |
| Team (if any) | $0 | $15K | $30K | $45K | $90K |
| Marketing | $2K | $10K | $25K | $50K | $87K |
| Legal/Audit | $5K | $10K | $10K | $5K | $30K |
| **Total** | $8K | $38K | $75K | $125K | **$246K** |

**Net Profit Year 1: ~$1.6M** (assuming grants + revenue - costs)

---

## Summary: What Makes This Compelling for Grants

1. **Novel Mechanism**: "Free to use, profit share" is unique in DeFi trading
2. **On-Chain Transparency**: All fees verifiable on-chain
3. **Token with Real Utility**: Not just governance theater
4. **Multi-Chain from Day 1**: Demonstrates ecosystem commitment
5. **User Alignment**: We only profit when users profit
6. **Sustainable**: High margins without extracting from losing traders

**Grant Pitch Angle:**
> "We're building the first trading protocol that only makes money when our users make money. Zero fees on losing trades. This aligns our incentives completely with user success and demonstrates real innovation in DeFi economics."
