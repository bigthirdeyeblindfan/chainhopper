# Agent F: Smart Contracts

## ⚠️ CRITICAL SECURITY CONTEXT

**All three major EVM trading bots were exploited in 2023-2024:**
- **Maestro**: $500K lost (October 2023) - Router contract vulnerability
- **Unibot**: $640K lost (October 2023) - Call injection exploit, token crashed 42%
- **Banana Gun**: $3M lost (September 2024) - Telegram message oracle vulnerability

**Our contracts MUST:**
1. Use OpenZeppelin for all standard functionality
2. Implement ReentrancyGuard on all external functions
3. Never store user private keys or funds long-term
4. Use Chainlink/Pyth for price oracles (not DEX spot prices)
5. Include timelock on admin functions
6. Pass Slither + Mythril before testnet deployment

---

## Your Responsibilities

You own all on-chain smart contracts:
- Fee collection contracts (EVM + TON)
- Swap router contracts
- Referral registry
- Deployment and verification

---

## Why On-Chain Contracts Matter

### For Grant Applications
1. **Transparency**: Grants love verifiable on-chain activity
2. **Decentralization**: Shows commitment to Web3 principles
3. **Metrics**: Easy to track volume, users, fees
4. **Composability**: Other protocols can integrate

### For Users
1. **Trust**: Fees are visible and auditable
2. **Non-custodial**: Funds flow through contracts, not our backend
3. **Permissionless**: Anyone can verify the code

---

## Task List

### S-001: FeeCollector Contract (EVM)
**Priority**: 🔴 Critical  
**Estimated Time**: 4-5 hours

**Purpose**: Collect platform fees from swaps transparently.

```solidity
// contracts/evm/FeeCollector.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FeeCollector
 * @notice Collects and distributes trading fees
 * @dev Fees are collected in the traded token and can be withdrawn by owner
 */
contract FeeCollector is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Fee configuration (basis points, 100 = 1%)
    uint256 public platformFeeBps = 50; // 0.5%
    uint256 public referralShareBps = 2000; // 20% of platform fee
    uint256 public constant MAX_FEE_BPS = 500; // 5% max
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // Treasury address for withdrawals
    address public treasury;
    
    // Referral tracking
    mapping(address => address) public referrerOf;
    mapping(address => uint256) public referralEarnings;
    mapping(address => uint256) public referralCount;
    
    // Analytics
    uint256 public totalVolume;
    uint256 public totalFeesCollected;
    uint256 public totalReferralsPaid;
    uint256 public totalSwaps;
    
    // Events
    event FeeCollected(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 fee,
        address indexed referrer,
        uint256 referralFee
    );
    event ReferralRegistered(address indexed user, address indexed referrer);
    event ReferralPaid(address indexed referrer, address indexed token, uint256 amount);
    event FeesWithdrawn(address indexed token, uint256 amount);
    event FeeUpdated(uint256 newFeeBps);
    
    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }
    
    /**
     * @notice Register a referrer for a user
     * @param referrer The referrer's address
     */
    function registerReferrer(address referrer) external {
        require(referrerOf[msg.sender] == address(0), "Already has referrer");
        require(referrer != msg.sender, "Cannot self-refer");
        require(referrer != address(0), "Invalid referrer");
        
        referrerOf[msg.sender] = referrer;
        referralCount[referrer]++;
        
        emit ReferralRegistered(msg.sender, referrer);
    }
    
    /**
     * @notice Collect fee from a swap
     * @param user The user performing the swap
     * @param token The token being swapped (address(0) for native)
     * @param amount The swap amount
     * @return netAmount The amount after fees
     */
    function collectFee(
        address user,
        address token,
        uint256 amount
    ) external payable nonReentrant returns (uint256 netAmount) {
        uint256 fee = (amount * platformFeeBps) / BPS_DENOMINATOR;
        netAmount = amount - fee;
        
        address referrer = referrerOf[user];
        uint256 referralFee = 0;
        
        if (referrer != address(0)) {
            referralFee = (fee * referralShareBps) / BPS_DENOMINATOR;
            referralEarnings[referrer] += referralFee;
            totalReferralsPaid += referralFee;
        }
        
        // Update analytics
        totalVolume += amount;
        totalFeesCollected += fee;
        totalSwaps++;
        
        emit FeeCollected(user, token, amount, fee, referrer, referralFee);
        
        return netAmount;
    }
    
    /**
     * @notice Calculate fee for an amount (view function for UI)
     */
    function calculateFee(uint256 amount) external view returns (
        uint256 fee,
        uint256 netAmount,
        uint256 referralFee
    ) {
        fee = (amount * platformFeeBps) / BPS_DENOMINATOR;
        netAmount = amount - fee;
        referralFee = (fee * referralShareBps) / BPS_DENOMINATOR;
    }
    
    /**
     * @notice Claim referral earnings
     * @param token The token to claim (address(0) for native)
     */
    function claimReferralEarnings(address token) external nonReentrant {
        uint256 earnings = referralEarnings[msg.sender];
        require(earnings > 0, "No earnings");
        
        referralEarnings[msg.sender] = 0;
        
        if (token == address(0)) {
            (bool success, ) = msg.sender.call{value: earnings}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, earnings);
        }
        
        emit ReferralPaid(msg.sender, token, earnings);
    }
    
    /**
     * @notice Withdraw collected fees to treasury
     * @param token The token to withdraw
     */
    function withdrawFees(address token) external onlyOwner {
        uint256 balance;
        
        if (token == address(0)) {
            balance = address(this).balance;
            (bool success, ) = treasury.call{value: balance}("");
            require(success, "ETH transfer failed");
        } else {
            balance = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransfer(treasury, balance);
        }
        
        emit FeesWithdrawn(token, balance);
    }
    
    /**
     * @notice Update platform fee (owner only)
     * @param newFeeBps New fee in basis points
     */
    function setFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        platformFeeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }
    
    /**
     * @notice Update treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        treasury = newTreasury;
    }
    
    // Allow receiving ETH
    receive() external payable {}
}
```

**Acceptance Criteria**:
- Compiles with Solidity 0.8.20
- Uses OpenZeppelin for security
- Full NatSpec documentation
- Events for all state changes
- Reentrancy protected
- Owner-only admin functions

---

### S-002: SwapRouter Contract (EVM)
**Priority**: 🟡 High  
**Estimated Time**: 6-8 hours  
**Dependencies**: S-001

**Purpose**: Unified interface for swaps across DEXs with automatic fee collection.

```solidity
// contracts/evm/SwapRouter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/IFeeCollector.sol";

/**
 * @title SwapRouter
 * @notice Routes swaps through various DEXs with automatic fee collection
 */
contract SwapRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IFeeCollector public immutable feeCollector;
    
    // Supported DEX routers
    mapping(bytes32 => address) public dexRouters;
    
    // Events
    event SwapExecuted(
        address indexed user,
        bytes32 indexed dexId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _feeCollector) {
        feeCollector = IFeeCollector(_feeCollector);
    }
    
    /**
     * @notice Execute a swap through a specified DEX
     * @param dexId Identifier for the DEX router
     * @param tokenIn Input token address (address(0) for native)
     * @param tokenOut Output token address
     * @param amountIn Amount to swap
     * @param amountOutMin Minimum output amount
     * @param deadline Transaction deadline
     */
    function swap(
        bytes32 dexId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external payable nonReentrant returns (uint256 amountOut) {
        require(deadline >= block.timestamp, "Expired");
        
        address router = dexRouters[dexId];
        require(router != address(0), "Unknown DEX");
        
        // Collect fee
        uint256 amountAfterFee = feeCollector.collectFee(
            msg.sender,
            tokenIn,
            amountIn
        );
        
        // Handle token transfer
        if (tokenIn != address(0)) {
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
            IERC20(tokenIn).safeApprove(router, amountAfterFee);
        }
        
        // Build path
        address[] memory path = new address[](2);
        path[0] = tokenIn == address(0) ? getWETH(router) : tokenIn;
        path[1] = tokenOut == address(0) ? getWETH(router) : tokenOut;
        
        // Execute swap
        uint256[] memory amounts;
        if (tokenIn == address(0)) {
            amounts = IUniswapV2Router(router).swapExactETHForTokens{
                value: amountAfterFee
            }(amountOutMin, path, msg.sender, deadline);
        } else if (tokenOut == address(0)) {
            amounts = IUniswapV2Router(router).swapExactTokensForETH(
                amountAfterFee, amountOutMin, path, msg.sender, deadline
            );
        } else {
            amounts = IUniswapV2Router(router).swapExactTokensForTokens(
                amountAfterFee, amountOutMin, path, msg.sender, deadline
            );
        }
        
        amountOut = amounts[amounts.length - 1];
        
        emit SwapExecuted(msg.sender, dexId, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    /**
     * @notice Add or update a DEX router
     */
    function setDexRouter(bytes32 dexId, address router) external {
        // In production: add access control
        dexRouters[dexId] = router;
    }
    
    function getWETH(address router) internal view returns (address) {
        return IUniswapV2Router(router).WETH();
    }
    
    receive() external payable {}
}
```

---

### S-005: TON Contracts (FunC)
**Priority**: 🟡 High  
**Estimated Time**: 8-10 hours

**Note**: TON uses FunC, not Solidity. This requires different expertise.

```func
;; contracts/ton/fee_collector.fc

;; Storage layout:
;; owner_address: MsgAddress
;; treasury_address: MsgAddress
;; platform_fee_bps: uint16
;; referral_share_bps: uint16
;; total_volume: Coins
;; total_fees: Coins
;; referrals: dict(address -> address)

#include "stdlib.fc";

;; Op codes
const int op::collect_fee = 0x1;
const int op::register_referrer = 0x2;
const int op::withdraw = 0x3;
const int op::update_fee = 0x4;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    if (in_msg_body.slice_empty?()) {
        return ();
    }
    
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == op::collect_fee) {
        ;; Handle fee collection
        slice sender = in_msg_body~load_msg_addr();
        int amount = in_msg_body~load_coins();
        
        ;; Calculate fees
        (int fee, int net_amount, int referral_fee) = calculate_fees(amount);
        
        ;; Store analytics
        ;; ...
        
        return ();
    }
    
    if (op == op::register_referrer) {
        ;; Register referral
        return ();
    }
    
    throw(0xffff); ;; Unknown op
}

(int, int, int) calculate_fees(int amount) inline {
    ;; Load config
    var ds = get_data().begin_parse();
    ds~load_msg_addr(); ;; owner
    ds~load_msg_addr(); ;; treasury
    int platform_fee_bps = ds~load_uint(16);
    int referral_share_bps = ds~load_uint(16);
    
    int fee = muldiv(amount, platform_fee_bps, 10000);
    int net_amount = amount - fee;
    int referral_fee = muldiv(fee, referral_share_bps, 10000);
    
    return (fee, net_amount, referral_fee);
}
```

**Alternative**: Use Tact (higher-level TON language):

```tact
// contracts/ton/FeeCollector.tact
import "@stdlib/deploy";

message CollectFee {
    user: Address;
    amount: Int as coins;
}

message RegisterReferrer {
    referrer: Address;
}

contract FeeCollector with Deployable {
    owner: Address;
    treasury: Address;
    platformFeeBps: Int as uint16;
    referralShareBps: Int as uint16;
    totalVolume: Int as coins;
    totalFees: Int as coins;
    referrals: map<Address, Address>;
    
    init(treasury: Address) {
        self.owner = sender();
        self.treasury = treasury;
        self.platformFeeBps = 50;
        self.referralShareBps = 2000;
        self.totalVolume = 0;
        self.totalFees = 0;
    }
    
    receive(msg: CollectFee) {
        let fee: Int = msg.amount * self.platformFeeBps / 10000;
        let netAmount: Int = msg.amount - fee;
        
        self.totalVolume = self.totalVolume + msg.amount;
        self.totalFees = self.totalFees + fee;
        
        // Handle referral
        let referrer: Address? = self.referrals.get(msg.user);
        if (referrer != null) {
            let referralFee: Int = fee * self.referralShareBps / 10000;
            // Send referral fee
        }
    }
    
    receive(msg: RegisterReferrer) {
        require(self.referrals.get(sender()) == null, "Already registered");
        self.referrals.set(sender(), msg.referrer);
    }
    
    get fun calculateFee(amount: Int): Int {
        return amount * self.platformFeeBps / 10000;
    }
    
    get fun stats(): (Int, Int) {
        return (self.totalVolume, self.totalFees);
    }
}
```

---

### S-004: Deployment Scripts
**Priority**: 🟡 High  
**Estimated Time**: 3-4 hours  
**Dependencies**: S-001, S-002, S-003

Create `contracts/scripts/`:

```typescript
// contracts/scripts/deploy-evm.ts
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);
  
  // Deploy FeeCollector
  const FeeCollector = await ethers.getContractFactory('FeeCollector');
  const feeCollector = await FeeCollector.deploy(process.env.TREASURY_ADDRESS);
  await feeCollector.waitForDeployment();
  console.log('FeeCollector:', await feeCollector.getAddress());
  
  // Deploy SwapRouter
  const SwapRouter = await ethers.getContractFactory('SwapRouter');
  const swapRouter = await SwapRouter.deploy(await feeCollector.getAddress());
  await swapRouter.waitForDeployment();
  console.log('SwapRouter:', await swapRouter.getAddress());
  
  // Configure DEX routers
  await swapRouter.setDexRouter(
    ethers.id('uniswap-v2'),
    process.env.UNISWAP_ROUTER
  );
  
  // Verify on explorer
  if (process.env.VERIFY) {
    await hre.run('verify:verify', {
      address: await feeCollector.getAddress(),
      constructorArguments: [process.env.TREASURY_ADDRESS],
    });
  }
}

main().catch(console.error);
```

**Deployment Checklist**:
- [ ] Sonic testnet
- [ ] Kaia testnet
- [ ] Berachain testnet
- [ ] Linea testnet
- [ ] TON testnet
- [ ] Mainnet (after audit)

---

## Contract Addresses Registry

Maintain in `contracts/deployments.json`:

```json
{
  "sonic": {
    "testnet": {
      "feeCollector": "0x...",
      "swapRouter": "0x...",
      "deployedAt": "2025-01-14",
      "verified": true
    },
    "mainnet": null
  },
  "ton": {
    "testnet": {
      "feeCollector": "EQ...",
      "deployedAt": "2025-01-14"
    }
  }
}
```

---

## Security Considerations

### For Audit Prep (S-P-002)

1. **Access Control**
   - Owner functions clearly marked
   - No unprotected state changes

2. **Reentrancy**
   - All external calls use checks-effects-interactions
   - ReentrancyGuard on critical functions

3. **Integer Overflow**
   - Using Solidity 0.8+ (built-in overflow checks)
   - Careful with multiplication before division

4. **Front-running**
   - Deadline parameter on swaps
   - MinOutput protection

5. **Centralization Risks**
   - Document owner privileges
   - Consider timelock for sensitive changes

**Tools to Run**:
```bash
# Slither (static analysis)
slither contracts/

# Mythril (symbolic execution)
myth analyze contracts/FeeCollector.sol

# Gas optimization
forge test --gas-report
```

---

## Testing

```bash
# Run tests
npx hardhat test

# Coverage
npx hardhat coverage

# Gas report
REPORT_GAS=true npx hardhat test
```

**Required Tests**:
- Fee calculation accuracy
- Referral registration
- Referral payout
- Access control
- Edge cases (0 amounts, max amounts)

---

## Environment Variables

```env
# Deployment
DEPLOYER_PRIVATE_KEY=
TREASURY_ADDRESS=

# Network RPCs
SONIC_RPC=https://rpc.soniclabs.com
KAIA_RPC=https://public-en.node.kaia.io

# Verification
SONICSCAN_API_KEY=
KAIASCAN_API_KEY=

# DEX Routers (per chain)
SONIC_DEX_ROUTER=0x...
KAIA_DEX_ROUTER=0x...
```

---

## Handoff Notes

When complete:
1. Update ORCHESTRATION.md
2. Add contract addresses to `deployments.json`
3. Export ABIs to `packages/contracts/abis/`
4. Notify Agent A to integrate contract calls
5. Document gas costs for each function
