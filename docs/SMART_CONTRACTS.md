# ChainHopper Smart Contracts

Technical documentation for ChainHopper's smart contract suite.

## Overview

ChainHopper uses a suite of smart contracts to handle on-chain fee collection, swap routing, and referral tracking. Contracts are deployed on multiple EVM chains and TON.

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Wallet                           │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │         SwapRouter            │
              │  • Routes swaps through DEXes │
              │  • Calculates profits         │
              │  • Triggers fee collection    │
              └───────────────┬───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐   ┌────────▼────────┐   ┌───────▼───────┐
│ FeeCollector  │   │ ReferralRegistry│   │  PriceOracle  │
│ • Tier system │   │ • Referral codes│   │ • Price feeds │
│ • Profit fees │   │ • Volume track  │   │ • Chainlink   │
│ • Referral $  │   │ • Tier bonuses  │   │ • Pyth        │
└───────────────┘   └─────────────────┘   └───────────────┘
```

---

## Contracts

### FeeCollector

The core contract implementing the profit-share fee model.

**Location:** `packages/contracts/src/FeeCollector.sol`

#### Fee Tiers

| Tier | Profit Share | Requirements |
|------|-------------|--------------|
| Free | 15% | None |
| Holder | 10% | 1,000 $HOPPER |
| Staker | 5% | 10,000 veHOPPER |
| Enterprise | 2-5% | Custom deal |

#### Referral Tiers

| Tier | Weekly Volume | Referrer Share | Referee Discount |
|------|---------------|----------------|------------------|
| Bronze | < $10K | 20% | 5% |
| Silver | $10K - $50K | 25% | 7.5% |
| Gold | $50K - $200K | 30% | 10% |
| Diamond | > $200K | 35% | 10% |

#### Key Functions

```solidity
/// @notice Collect profit-share fee from a trade
/// @param user The user who made the profit
/// @param token Token address (address(0) for native)
/// @param profit The profit amount
/// @return fee The collected fee
/// @return netProfit Profit after fee
function collectProfitFee(
    address user,
    address token,
    uint256 profit
) external returns (uint256 fee, uint256 netProfit);

/// @notice Calculate fee without executing (for UI preview)
function calculateProfitFee(
    address user,
    uint256 profit
) external view returns (uint256 fee, uint256 netProfit, uint256 referralReward);

/// @notice Register a referrer for the calling user
function registerReferrer(address referrer) external;

/// @notice Claim accumulated referral earnings
function claimReferralEarnings(address token) external;

/// @notice Get user's tier info
function getUserTierInfo(address user) external view returns (Tier tier, uint256 profitShareBps);
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
event UserTierChanged(address indexed user, Tier oldTier, Tier newTier);
```

#### Admin Functions

```solidity
// Only callable by owner (multi-sig)
function setTierConfig(Tier tier, uint256 profitShareBps, bool active) external;
function setUserTier(address user, Tier tier) external;
function setEnterpriseRate(address user, uint256 rateBps) external;
function withdrawFees(address token) external;
function pause() external;
function unpause() external;
```

---

### SwapRouter

Routes swaps through DEX aggregators and triggers fee collection.

**Location:** `packages/contracts/src/SwapRouter.sol`

#### Key Functions

```solidity
/// @notice Execute a swap with automatic fee collection
/// @param params Swap parameters
/// @return amountOut Actual amount received
function swap(SwapParams calldata params) external payable returns (uint256 amountOut);

/// @notice Execute a swap without fee collection (for internal use)
function swapExact(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 minAmountOut,
    bytes calldata routeData
) external payable returns (uint256 amountOut);

/// @notice Get quote from aggregator
function getQuote(
    address tokenIn,
    address tokenOut,
    uint256 amountIn
) external view returns (uint256 amountOut, bytes memory routeData);
```

#### Swap Parameters

```solidity
struct SwapParams {
    address tokenIn;
    address tokenOut;
    uint256 amountIn;
    uint256 minAmountOut;
    address recipient;
    uint256 deadline;
    bytes routeData;        // Encoded DEX route
    bool collectFee;        // Whether to collect profit fee
    uint256 entryPrice;     // Entry price for profit calculation
}
```

---

### ReferralRegistry

Manages referral codes and tracks referral relationships.

**Location:** `packages/contracts/src/ReferralRegistry.sol`

#### Key Functions

```solidity
/// @notice Generate a referral code for caller
function generateCode() external returns (string memory code);

/// @notice Register using a referral code
function registerWithCode(string calldata code) external;

/// @notice Get referrer for a user
function getReferrer(address user) external view returns (address);

/// @notice Get referral stats for a user
function getReferralStats(address user) external view returns (
    uint256 totalReferrals,
    uint256 totalVolume,
    uint256 totalEarnings
);
```

---

### PriceOracle

Aggregates price data from multiple sources.

**Location:** `packages/contracts/src/PriceOracle.sol`

#### Supported Sources

- Chainlink Price Feeds
- Pyth Network
- DexScreener (off-chain backup)

#### Key Functions

```solidity
/// @notice Get price for a token in USD
function getPrice(address token) external view returns (uint256 price, uint8 decimals);

/// @notice Get price with freshness check
function getPriceWithTimestamp(address token) external view returns (
    uint256 price,
    uint8 decimals,
    uint256 timestamp
);

/// @notice Check if price is stale
function isPriceStale(address token) external view returns (bool);
```

---

## TON Contracts

ChainHopper also deploys contracts on TON for fee collection.

**Location:** `packages/contracts/ton/`

### FunC Implementation

```func
;; fee_collector.fc - FunC implementation

;; Op codes
const int op::collect_fee = 0x1;
const int op::register_referrer = 0x2;
const int op::claim_earnings = 0x3;
const int op::withdraw = 0x4;

;; Tier rates (basis points)
const int FREE_RATE = 1500;      ;; 15%
const int HOLDER_RATE = 1000;    ;; 10%
const int STAKER_RATE = 500;     ;; 5%
```

### Tact Implementation

```tact
// FeeCollector.tact - Higher-level implementation

contract FeeCollector {
    treasury: Address;
    totalFeesCollected: Int;

    receive(msg: CollectFee) {
        let fee = msg.profit * self.getUserRate(msg.user) / 10000;
        // Process fee...
    }
}
```

---

## Integration Guide

### TypeScript Client

```typescript
import { FeeCollectorClient, SwapRouterClient } from '@chainhopper/core';
import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

// Initialize clients
const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

const feeCollector = new FeeCollectorClient({
  address: '0x...',
  publicClient
});

// Calculate fee preview
const { fee, netProfit } = await feeCollector.calculateProfitFee(
  userAddress,
  profitAmount
);

// Register referrer
await feeCollector.registerReferrer(referrerAddress);

// Get user stats
const stats = await feeCollector.getUserStats(userAddress);
console.log(`Tier: ${stats.tier}, Total Volume: ${stats.totalVolume}`);
```

### Executing Swaps with Fees

```typescript
import { SwapRouterClient } from '@chainhopper/core';

const swapRouter = new SwapRouterClient({
  address: '0x...',
  walletClient
});

// Get quote
const quote = await swapRouter.getQuote({
  tokenIn: WETH_ADDRESS,
  tokenOut: USDC_ADDRESS,
  amountIn: parseEther('1')
});

// Execute swap with fee collection
const txHash = await swapRouter.swap({
  ...quote,
  recipient: userAddress,
  collectFee: true,
  entryPrice: userEntryPrice
});

// Wait for confirmation
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
```

### Claiming Referral Earnings

```typescript
// Check earnings
const earnings = await feeCollector.referralEarnings(userAddress, USDC_ADDRESS);

// Claim if > 0
if (earnings > 0n) {
  await feeCollector.claimReferralEarnings(USDC_ADDRESS);
}
```

---

## Security Considerations

### Access Control

- **Owner**: Multi-sig wallet (Gnosis Safe recommended)
- **Pausable**: Emergency stop capability
- **ReentrancyGuard**: Protection against reentrancy attacks

### Upgrade Path

Contracts are **not upgradeable** by design. For updates:
1. Deploy new contract
2. Migrate treasury funds
3. Update frontend to use new address
4. Mark old contract as deprecated

### Audit Status

| Contract | Audit Status | Auditor |
|----------|-------------|---------|
| FeeCollector | Pending | - |
| SwapRouter | Pending | - |
| ReferralRegistry | Pending | - |

---

## Testing

### Run All Tests

```bash
cd packages/contracts
forge test
```

### Run Specific Tests

```bash
# FeeCollector tests
forge test --match-contract FeeCollectorTest

# Gas report
forge test --gas-report

# Coverage
forge coverage
```

### Key Test Cases

```solidity
// FeeCollector.t.sol

function testCollectProfitFee_FreeTier() public {
    // Free tier should charge 15%
    uint256 profit = 1000 ether;
    (uint256 fee,) = feeCollector.collectProfitFee(user, token, profit);
    assertEq(fee, 150 ether); // 15%
}

function testCollectProfitFee_WithReferral() public {
    // Register referrer
    vm.prank(user);
    feeCollector.registerReferrer(referrer);

    // Fee should be discounted, referrer gets reward
    (uint256 fee,) = feeCollector.collectProfitFee(user, token, profit);
    uint256 referralEarnings = feeCollector.referralEarnings(referrer, token);
    assertGt(referralEarnings, 0);
}
```

---

## Deployment

### Testnet

```bash
# Deploy to Sepolia
forge script script/DeployAll.s.sol \
  --rpc-url $SEPOLIA_RPC \
  --broadcast \
  --verify

# Verify manually if needed
forge verify-contract $ADDRESS src/FeeCollector.sol:FeeCollector \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(address)" $TREASURY)
```

### Mainnet

```bash
# Deploy to Base
make deploy-base

# Deploy to all chains
make deploy-all
```

### Post-Deployment

```bash
# Transfer ownership to multi-sig
cast send $FEE_COLLECTOR "transferOwnership(address)" $MULTISIG \
  --private-key $DEPLOYER_KEY

# Verify ownership
cast call $FEE_COLLECTOR "owner()"
```

---

## Contract Addresses

### Mainnet

| Chain | FeeCollector | SwapRouter | ReferralRegistry |
|-------|--------------|------------|------------------|
| Ethereum | TBD | TBD | TBD |
| Base | TBD | TBD | TBD |
| Arbitrum | TBD | TBD | TBD |
| Polygon | TBD | TBD | TBD |
| BSC | TBD | TBD | TBD |

### Testnet

| Chain | FeeCollector | SwapRouter | ReferralRegistry |
|-------|--------------|------------|------------------|
| Sepolia | TBD | TBD | TBD |
| Base Sepolia | TBD | TBD | TBD |

---

## Gas Optimization

### Gas Costs (Estimated)

| Function | Gas Cost |
|----------|----------|
| `collectProfitFee` | ~80,000 |
| `registerReferrer` | ~50,000 |
| `claimReferralEarnings` | ~60,000 |
| `swap` | ~200,000+ |

### Optimization Tips

1. **Batch operations** where possible
2. **Use calldata** instead of memory for read-only params
3. **Pack structs** to minimize storage slots
4. **Cache storage reads** in local variables

---

## Error Codes

| Error | Description |
|-------|-------------|
| `InvalidAddress()` | Zero address provided |
| `AlreadyHasReferrer()` | User already has a referrer |
| `CannotSelfRefer()` | Cannot refer yourself |
| `FeeTooHigh()` | Fee exceeds maximum |
| `NoEarnings()` | No referral earnings to claim |
| `TransferFailed()` | ETH transfer failed |
| `TierNotActive()` | User's tier is disabled |
| `ReferralShareTooHigh()` | Referral share exceeds max |
