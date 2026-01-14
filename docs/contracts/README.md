# ChainHopper Smart Contracts

This document describes the ChainHopper smart contract architecture and deployment.

## Overview

ChainHopper uses a modular contract architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        SwapRouter                                │
│  Routes swaps through DEX aggregators, integrates fee system    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  FeeCollector   │ │ ReferralRegistry│ │   PriceOracle   │
│  Profit-share   │ │  Referral codes │ │ Chainlink/Pyth  │
│  fee model      │ │  and tracking   │ │  price feeds    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Contracts

### FeeCollector.sol

The core fee collection contract implementing the profit-share model.

**Location:** `packages/contracts/src/FeeCollector.sol`

#### Features

- **Profit-Share Tiers:**
  - Free: 15% of profits
  - Holder: 10% of profits (requires 1,000 $HOPPER)
  - Staker: 5% of profits (requires 10,000 veHOPPER)
  - Enterprise: 2-5% custom rates

- **Referral System:**
  - Bronze: 20% referrer share, 5% referee discount
  - Silver: 25% referrer share, 7.5% referee discount
  - Gold: 30% referrer share, 10% referee discount
  - Diamond: 35% referrer share, 10% referee discount

#### Key Functions

```solidity
// Collect profit-share fee
function collectProfitFee(
    address user,
    address token,
    uint256 profit
) external returns (uint256 fee, uint256 netProfit);

// Calculate fee without collecting
function calculateProfitFee(
    address user,
    uint256 profit
) external view returns (uint256 fee, uint256 netProfit, uint256 referralReward);

// Register a referrer
function registerReferrer(address referrer) external;

// Claim referral earnings
function claimReferralEarnings(address token) external;
```

#### Events

```solidity
event ProfitFeeCollected(
    address indexed user,
    address indexed token,
    uint256 profit,
    uint256 fee,
    address indexed referrer,
    uint256 referralReward
);

event ReferralRegistered(address indexed user, address indexed referrer);
event ReferralClaimed(address indexed referrer, address indexed token, uint256 amount);
```

---

### SwapRouter.sol

Routes token swaps through registered DEX aggregators.

**Location:** `packages/contracts/src/SwapRouter.sol`

#### Features

- Multi-DEX routing (Uniswap, SushiSwap, 1inch, etc.)
- Automatic fee collection on profitable trades
- Slippage protection
- Deadline enforcement

#### Key Functions

```solidity
// Execute a swap
function swap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin,
    address dex,
    bytes calldata dexData,
    uint256 deadline
) external returns (uint256 amountOut);

// Execute swap with native token
function swapExactETHForTokens(
    address tokenOut,
    uint256 amountOutMin,
    address dex,
    bytes calldata dexData,
    uint256 deadline
) external payable returns (uint256 amountOut);

// Register a DEX (admin only)
function registerDex(string calldata name, address router) external;
```

---

### ReferralRegistry.sol

On-chain referral code system for user acquisition.

**Location:** `packages/contracts/src/ReferralRegistry.sol`

#### Features

- Human-readable referral codes (e.g., "ALICE", "TRADER123")
- Tier-based rewards (Bronze/Silver/Gold/Diamond)
- Volume tracking per referrer
- Integration with FeeCollector for reward distribution

#### Key Functions

```solidity
// Register a referral code
function registerCode(bytes32 code) external;

// Use a referral code
function useCode(bytes32 code) external;

// Get referrer for a user
function getReferrer(address user) external view returns (address);

// Get referrer stats
function getReferrerData(address referrer) external view returns (
    bytes32 code,
    uint256 referralCount,
    uint256 totalVolume,
    uint256 totalEarnings,
    Tier tier
);
```

---

### PriceOracle.sol

Multi-source price oracle with Chainlink and Pyth support.

**Location:** `packages/contracts/src/PriceOracle.sol`

#### Features

- Chainlink as primary price source
- Pyth Network as fallback
- Staleness validation (default 1 hour)
- Decimal normalization to 8 decimals

#### Key Functions

```solidity
// Get current price
function getPrice(address token) external view returns (uint256 price);

// Get price with metadata
function getPriceData(address token) external view returns (
    uint256 price,
    uint256 updatedAt,
    uint8 decimals,
    PriceSource source
);

// Get USD value of token amount
function getValueUSD(address token, uint256 amount) external view returns (uint256 value);

// Configure a price feed (admin only)
function configureFeed(
    address token,
    address chainlinkFeed,
    bytes32 pythPriceId,
    uint256 maxStaleness
) external;
```

---

## Deployment

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- Environment variables configured (see `.env.example`)

### Local Development

```bash
cd packages/contracts

# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test -vvv

# Run with gas reporting
forge test --gas-report
```

### Deploy to Testnet

```bash
# Set environment variables
export SEPOLIA_RPC_URL="https://..."
export PRIVATE_KEY="0x..."
export ETHERSCAN_API_KEY="..."

# Deploy all contracts
make deploy-sepolia

# Or deploy individually
make deploy-fee-collector RPC_URL=$SEPOLIA_RPC_URL
```

### Deploy to Mainnet

```bash
# Dry run first
make deploy-all-dry RPC_URL=$MAINNET_RPC_URL

# Deploy
make deploy-mainnet

# Verify
make verify-fee-collector
make verify-swap-router
make verify-referral-registry
```

### Deployed Addresses

| Network | FeeCollector | SwapRouter | ReferralRegistry | PriceOracle |
|---------|--------------|------------|------------------|-------------|
| Ethereum | TBD | TBD | TBD | TBD |
| Base | TBD | TBD | TBD | TBD |
| Arbitrum | TBD | TBD | TBD | TBD |
| Optimism | TBD | TBD | TBD | TBD |

---

## Security

### Audit Status

The contracts have undergone the following security measures:

- [x] Slither static analysis
- [x] Mythril symbolic execution
- [x] Unit tests (95%+ coverage)
- [x] Invariant/fuzz tests
- [ ] External audit (pending)

### Security Features

1. **Reentrancy Protection:** All state-changing functions use `ReentrancyGuard`
2. **Access Control:** Admin functions protected with `Ownable`
3. **Pausable:** Emergency pause functionality
4. **Input Validation:** Zero address and amount checks
5. **Safe Token Transfers:** Using OpenZeppelin's `SafeERC20`

### Running Security Analysis

```bash
cd packages/contracts

# Run Slither
make slither

# Run Mythril
make mythril

# Full audit
make audit

# Quick audit (Slither only)
make audit-quick
```

---

## Gas Optimization

### Gas Estimates

| Function | Gas (approx) |
|----------|--------------|
| `collectProfitFee` | ~50,000 |
| `swap` | ~150,000 |
| `registerCode` | ~45,000 |
| `useCode` | ~35,000 |
| `getPrice` | ~25,000 |

### Optimization Techniques

- Storage packing for structs
- Caching storage reads in memory
- Using `calldata` for array parameters
- Minimal external calls in hot paths

---

## TON Contracts

ChainHopper also supports TON blockchain with FunC contracts.

**Location:** `packages/contracts/ton/`

### FeeCollector (FunC)

```func
;; Collect fee from profit
() collect_fee(slice sender, int profit, slice token) impure {
    ;; Implementation
}

;; Claim referral rewards
() claim_rewards(slice referrer) impure {
    ;; Implementation
}
```

See `packages/contracts/ton/README.md` for full documentation.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `forge test`
4. Run security checks: `make slither`
5. Submit a pull request

### Code Style

- Follow Solidity style guide
- Use NatSpec comments for public functions
- Keep functions under 50 lines
- Use custom errors instead of require strings
