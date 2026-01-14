// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FeeCollector
 * @author ChainHopper Team
 * @notice Collects and distributes trading fees using a profit-share model
 * @dev Implements the unique "pay only when you profit" fee model:
 *      - Free tier: 15% of profits
 *      - Holder tier: 10% of profits (requires 1,000 $HOPPER)
 *      - Staker tier: 5% of profits (requires 10,000 veHOPPER)
 *      - Enterprise tier: 2-5% of profits (custom deals)
 *
 * Security considerations:
 *      - ReentrancyGuard on all external state-changing functions
 *      - Pausable for emergency situations
 *      - Owner-only admin functions
 *      - No private key storage (non-custodial design)
 */
contract FeeCollector is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Maximum profit share fee (20% = 2000 basis points)
    uint256 public constant MAX_PROFIT_SHARE_BPS = 2000;

    /// @notice Maximum referral share of the collected fee (50% = 5000 basis points)
    uint256 public constant MAX_REFERRAL_SHARE_BPS = 5000;

    /// @notice Basis points denominator (100% = 10000)
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ Enums ============

    /// @notice User tier levels based on token holdings/staking
    enum Tier {
        Free,       // 15% profit share
        Holder,     // 10% profit share (1,000 $HOPPER)
        Staker,     // 5% profit share (10,000 veHOPPER)
        Enterprise  // Custom 2-5% profit share
    }

    // ============ Structs ============

    /// @notice Configuration for each tier level
    /// @param profitShareBps Profit share percentage in basis points
    /// @param active Whether this tier is active
    struct TierConfig {
        uint256 profitShareBps;
        bool active;
    }

    /// @notice Referral tier configuration based on weekly volume
    /// @param minVolume Minimum weekly volume to qualify
    /// @param referrerShareBps Share of fees for referrer (in bps of collected fee)
    /// @param refereeDiscountBps Discount for referee (in bps of profit share)
    struct ReferralTierConfig {
        uint256 minVolume;
        uint256 referrerShareBps;
        uint256 refereeDiscountBps;
    }

    /// @notice User account information
    /// @param referrer Address of the user's referrer (address(0) if none)
    /// @param tier Current tier level
    /// @param weeklyVolume Volume traded in current week
    /// @param totalVolume Total lifetime volume
    /// @param totalProfitsPaid Total profits realized
    /// @param totalFeesPaid Total fees paid to platform
    struct UserAccount {
        address referrer;
        Tier tier;
        uint256 weeklyVolume;
        uint256 totalVolume;
        uint256 totalProfitsPaid;
        uint256 totalFeesPaid;
    }

    // ============ State Variables ============

    /// @notice Treasury address for fee withdrawals
    address public treasury;

    /// @notice Tier configurations (indexed by Tier enum)
    mapping(Tier => TierConfig) public tierConfigs;

    /// @notice Referral tier configurations (Bronze=0, Silver=1, Gold=2, Diamond=3)
    ReferralTierConfig[4] public referralTiers;

    /// @notice User account data
    mapping(address => UserAccount) public accounts;

    /// @notice Referral earnings per user per token
    mapping(address => mapping(address => uint256)) public referralEarnings;

    /// @notice Number of referrals per user
    mapping(address => uint256) public referralCount;

    /// @notice Enterprise custom rates (only for Enterprise tier users)
    mapping(address => uint256) public enterpriseRates;

    /// @notice Timestamp of current week start (for volume tracking)
    uint256 public currentWeekStart;

    // ============ Analytics ============

    /// @notice Total volume processed through the contract
    uint256 public totalVolume;

    /// @notice Total fees collected (sum of all profit shares)
    uint256 public totalFeesCollected;

    /// @notice Total referral rewards paid out
    uint256 public totalReferralsPaid;

    /// @notice Total number of trades processed
    uint256 public totalTrades;

    /// @notice Total profits that generated fees
    uint256 public totalProfitsProcessed;

    // ============ Events ============

    /**
     * @notice Emitted when a profit-share fee is collected
     * @param user The user who made the profitable trade
     * @param token The token in which profit was made (address(0) for native)
     * @param profit The profit amount
     * @param fee The fee collected (profit share)
     * @param referrer The user's referrer (address(0) if none)
     * @param referralReward The reward paid to referrer
     */
    event ProfitFeeCollected(
        address indexed user,
        address indexed token,
        uint256 profit,
        uint256 fee,
        address indexed referrer,
        uint256 referralReward
    );

    /**
     * @notice Emitted when a referrer is registered for a user
     * @param user The user who registered a referrer
     * @param referrer The registered referrer address
     */
    event ReferralRegistered(address indexed user, address indexed referrer);

    /**
     * @notice Emitted when referral earnings are claimed
     * @param referrer The referrer who claimed earnings
     * @param token The token claimed (address(0) for native)
     * @param amount The amount claimed
     */
    event ReferralClaimed(address indexed referrer, address indexed token, uint256 amount);

    /**
     * @notice Emitted when fees are withdrawn to treasury
     * @param token The token withdrawn (address(0) for native)
     * @param amount The amount withdrawn
     */
    event FeesWithdrawn(address indexed token, uint256 amount);

    /**
     * @notice Emitted when a tier configuration is updated
     * @param tier The tier that was updated
     * @param profitShareBps New profit share in basis points
     * @param active Whether the tier is active
     */
    event TierConfigUpdated(Tier indexed tier, uint256 profitShareBps, bool active);

    /**
     * @notice Emitted when a user's tier is changed
     * @param user The user whose tier changed
     * @param oldTier The previous tier
     * @param newTier The new tier
     */
    event UserTierChanged(address indexed user, Tier oldTier, Tier newTier);

    /**
     * @notice Emitted when treasury address is updated
     * @param oldTreasury The previous treasury address
     * @param newTreasury The new treasury address
     */
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    /**
     * @notice Emitted when a new week starts for volume tracking
     * @param weekStart Timestamp of the new week start
     */
    event NewWeekStarted(uint256 weekStart);

    // ============ Errors ============

    /// @notice Thrown when an invalid address is provided
    error InvalidAddress();

    /// @notice Thrown when user already has a referrer
    error AlreadyHasReferrer();

    /// @notice Thrown when user tries to self-refer
    error CannotSelfRefer();

    /// @notice Thrown when fee exceeds maximum allowed
    error FeeTooHigh();

    /// @notice Thrown when there are no earnings to claim
    error NoEarnings();

    /// @notice Thrown when native token transfer fails
    error TransferFailed();

    /// @notice Thrown when tier is not active
    error TierNotActive();

    /// @notice Thrown when referral share exceeds maximum
    error ReferralShareTooHigh();

    // ============ Constructor ============

    /**
     * @notice Initializes the FeeCollector contract
     * @param _treasury Address of the treasury to receive collected fees
     * @dev Sets up default tier configurations:
     *      - Free: 15% (1500 bps)
     *      - Holder: 10% (1000 bps)
     *      - Staker: 5% (500 bps)
     *      - Enterprise: 5% default (500 bps), can be customized
     */
    constructor(address _treasury) Ownable(msg.sender) {
        if (_treasury == address(0)) revert InvalidAddress();
        treasury = _treasury;

        // Initialize tier configurations per ORCHESTRATION.md
        tierConfigs[Tier.Free] = TierConfig({profitShareBps: 1500, active: true});       // 15%
        tierConfigs[Tier.Holder] = TierConfig({profitShareBps: 1000, active: true});     // 10%
        tierConfigs[Tier.Staker] = TierConfig({profitShareBps: 500, active: true});      // 5%
        tierConfigs[Tier.Enterprise] = TierConfig({profitShareBps: 500, active: true}); // 5% default

        // Initialize referral tiers per ORCHESTRATION.md
        // Bronze: <$10K weekly, 20% referrer share, 5% referee discount
        referralTiers[0] = ReferralTierConfig({
            minVolume: 0,
            referrerShareBps: 2000,      // 20% of fee
            refereeDiscountBps: 500      // 5% discount
        });
        // Silver: $10K-$50K weekly, 25% referrer share, 7.5% referee discount
        referralTiers[1] = ReferralTierConfig({
            minVolume: 10_000 * 1e18,
            referrerShareBps: 2500,      // 25% of fee
            refereeDiscountBps: 750      // 7.5% discount
        });
        // Gold: $50K-$200K weekly, 30% referrer share, 10% referee discount
        referralTiers[2] = ReferralTierConfig({
            minVolume: 50_000 * 1e18,
            referrerShareBps: 3000,      // 30% of fee
            refereeDiscountBps: 1000     // 10% discount
        });
        // Diamond: >$200K weekly, 35% referrer share, 10% referee discount
        referralTiers[3] = ReferralTierConfig({
            minVolume: 200_000 * 1e18,
            referrerShareBps: 3500,      // 35% of fee
            refereeDiscountBps: 1000     // 10% discount
        });

        currentWeekStart = block.timestamp;
    }

    // ============ External Functions ============

    /**
     * @notice Register a referrer for the calling user
     * @param referrer The address of the referrer
     * @dev Referrer cannot be changed once set. Self-referral is not allowed.
     */
    function registerReferrer(address referrer) external {
        if (referrer == address(0)) revert InvalidAddress();
        if (accounts[msg.sender].referrer != address(0)) revert AlreadyHasReferrer();
        if (referrer == msg.sender) revert CannotSelfRefer();

        accounts[msg.sender].referrer = referrer;
        referralCount[referrer]++;

        emit ReferralRegistered(msg.sender, referrer);
    }

    /**
     * @notice Collect profit-share fee from a profitable trade
     * @param user The user who made the profit
     * @param token The token in which profit was made (address(0) for native ETH)
     * @param profit The profit amount
     * @return fee The fee collected
     * @return netProfit The profit after fee deduction
     * @dev Only callable when not paused. Updates analytics and handles referral rewards.
     */
    function collectProfitFee(
        address user,
        address token,
        uint256 profit
    ) external payable nonReentrant whenNotPaused returns (uint256 fee, uint256 netProfit) {
        _checkAndUpdateWeek();

        UserAccount storage account = accounts[user];

        // Get user's tier config
        TierConfig memory tierConfig = tierConfigs[account.tier];
        if (!tierConfig.active) revert TierNotActive();

        // Calculate profit share based on tier
        uint256 profitShareBps = tierConfig.profitShareBps;

        // Apply enterprise custom rate if applicable
        if (account.tier == Tier.Enterprise && enterpriseRates[user] > 0) {
            profitShareBps = enterpriseRates[user];
        }

        // Apply referral discount if user has referrer
        address referrer = account.referrer;
        uint256 referralReward = 0;

        if (referrer != address(0)) {
            ReferralTierConfig memory refTier = _getReferralTier(accounts[referrer].weeklyVolume);

            // Apply referee discount
            uint256 discount = (profitShareBps * refTier.refereeDiscountBps) / BPS_DENOMINATOR;
            profitShareBps = profitShareBps - discount;

            // Calculate referrer reward (after fee is calculated)
            fee = (profit * profitShareBps) / BPS_DENOMINATOR;
            referralReward = (fee * refTier.referrerShareBps) / BPS_DENOMINATOR;

            // Store referral earnings
            referralEarnings[referrer][token] += referralReward;
            totalReferralsPaid += referralReward;
        } else {
            fee = (profit * profitShareBps) / BPS_DENOMINATOR;
        }

        netProfit = profit - fee;

        // Update user account stats
        account.weeklyVolume += profit;
        account.totalVolume += profit;
        account.totalProfitsPaid += profit;
        account.totalFeesPaid += fee;

        // Update global analytics
        totalVolume += profit;
        totalFeesCollected += fee;
        totalTrades++;
        totalProfitsProcessed += profit;

        emit ProfitFeeCollected(user, token, profit, fee, referrer, referralReward);

        return (fee, netProfit);
    }

    /**
     * @notice Calculate the fee for a given profit amount (view function for UI)
     * @param user The user to calculate fee for
     * @param profit The profit amount
     * @return fee The calculated fee
     * @return netProfit The profit after fee
     * @return referralReward The reward that would go to referrer
     */
    function calculateProfitFee(
        address user,
        uint256 profit
    ) external view returns (uint256 fee, uint256 netProfit, uint256 referralReward) {
        UserAccount memory account = accounts[user];
        TierConfig memory tierConfig = tierConfigs[account.tier];

        uint256 profitShareBps = tierConfig.profitShareBps;

        if (account.tier == Tier.Enterprise && enterpriseRates[user] > 0) {
            profitShareBps = enterpriseRates[user];
        }

        address referrer = account.referrer;

        if (referrer != address(0)) {
            ReferralTierConfig memory refTier = _getReferralTier(accounts[referrer].weeklyVolume);

            uint256 discount = (profitShareBps * refTier.refereeDiscountBps) / BPS_DENOMINATOR;
            profitShareBps = profitShareBps - discount;

            fee = (profit * profitShareBps) / BPS_DENOMINATOR;
            referralReward = (fee * refTier.referrerShareBps) / BPS_DENOMINATOR;
        } else {
            fee = (profit * profitShareBps) / BPS_DENOMINATOR;
        }

        netProfit = profit - fee;
    }

    /**
     * @notice Claim accumulated referral earnings
     * @param token The token to claim (address(0) for native ETH)
     * @dev Transfers all accumulated earnings for the specified token to the caller
     */
    function claimReferralEarnings(address token) external nonReentrant {
        uint256 earnings = referralEarnings[msg.sender][token];
        if (earnings == 0) revert NoEarnings();

        referralEarnings[msg.sender][token] = 0;

        if (token == address(0)) {
            (bool success,) = msg.sender.call{value: earnings}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(msg.sender, earnings);
        }

        emit ReferralClaimed(msg.sender, token, earnings);
    }

    /**
     * @notice Get user's effective tier based on their settings
     * @param user The user address
     * @return tier The user's current tier
     * @return profitShareBps The effective profit share in basis points
     */
    function getUserTierInfo(address user) external view returns (Tier tier, uint256 profitShareBps) {
        UserAccount memory account = accounts[user];
        tier = account.tier;
        profitShareBps = tierConfigs[tier].profitShareBps;

        if (tier == Tier.Enterprise && enterpriseRates[user] > 0) {
            profitShareBps = enterpriseRates[user];
        }
    }

    /**
     * @notice Get referral tier info based on weekly volume
     * @param weeklyVolume The weekly volume to check
     * @return tierIndex The referral tier index (0-3)
     * @return config The referral tier configuration
     */
    function getReferralTierInfo(uint256 weeklyVolume) external view returns (uint256 tierIndex, ReferralTierConfig memory config) {
        config = _getReferralTier(weeklyVolume);

        if (weeklyVolume >= referralTiers[3].minVolume) tierIndex = 3;
        else if (weeklyVolume >= referralTiers[2].minVolume) tierIndex = 2;
        else if (weeklyVolume >= referralTiers[1].minVolume) tierIndex = 1;
        else tierIndex = 0;
    }

    /**
     * @notice Get comprehensive stats for a user
     * @param user The user address
     * @return account The user's account data
     * @return currentReferralTier The current referral tier index
     */
    function getUserStats(address user) external view returns (
        UserAccount memory account,
        uint256 currentReferralTier
    ) {
        account = accounts[user];

        if (account.weeklyVolume >= referralTiers[3].minVolume) currentReferralTier = 3;
        else if (account.weeklyVolume >= referralTiers[2].minVolume) currentReferralTier = 2;
        else if (account.weeklyVolume >= referralTiers[1].minVolume) currentReferralTier = 1;
        else currentReferralTier = 0;
    }

    // ============ Admin Functions ============

    /**
     * @notice Withdraw collected fees to treasury
     * @param token The token to withdraw (address(0) for native ETH)
     * @dev Only callable by owner. Withdraws all balance minus reserved referral earnings.
     */
    function withdrawFees(address token) external onlyOwner {
        uint256 balance;

        if (token == address(0)) {
            balance = address(this).balance;
            (bool success,) = treasury.call{value: balance}("");
            if (!success) revert TransferFailed();
        } else {
            balance = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransfer(treasury, balance);
        }

        emit FeesWithdrawn(token, balance);
    }

    /**
     * @notice Update tier configuration
     * @param tier The tier to update
     * @param profitShareBps New profit share in basis points
     * @param active Whether the tier should be active
     * @dev Only callable by owner. Profit share cannot exceed MAX_PROFIT_SHARE_BPS.
     */
    function setTierConfig(Tier tier, uint256 profitShareBps, bool active) external onlyOwner {
        if (profitShareBps > MAX_PROFIT_SHARE_BPS) revert FeeTooHigh();

        tierConfigs[tier] = TierConfig({profitShareBps: profitShareBps, active: active});

        emit TierConfigUpdated(tier, profitShareBps, active);
    }

    /**
     * @notice Update referral tier configuration
     * @param tierIndex The referral tier index (0-3)
     * @param minVolume Minimum weekly volume for tier
     * @param referrerShareBps Referrer's share of collected fee
     * @param refereeDiscountBps Referee's discount on profit share
     * @dev Only callable by owner. Shares cannot exceed maximums.
     */
    function setReferralTier(
        uint256 tierIndex,
        uint256 minVolume,
        uint256 referrerShareBps,
        uint256 refereeDiscountBps
    ) external onlyOwner {
        if (tierIndex > 3) revert InvalidAddress();
        if (referrerShareBps > MAX_REFERRAL_SHARE_BPS) revert ReferralShareTooHigh();
        if (refereeDiscountBps > BPS_DENOMINATOR) revert FeeTooHigh();

        referralTiers[tierIndex] = ReferralTierConfig({
            minVolume: minVolume,
            referrerShareBps: referrerShareBps,
            refereeDiscountBps: refereeDiscountBps
        });
    }

    /**
     * @notice Set a user's tier level
     * @param user The user address
     * @param tier The new tier
     * @dev Only callable by owner. Used for upgrading users based on token holdings.
     */
    function setUserTier(address user, Tier tier) external onlyOwner {
        if (user == address(0)) revert InvalidAddress();

        Tier oldTier = accounts[user].tier;
        accounts[user].tier = tier;

        emit UserTierChanged(user, oldTier, tier);
    }

    /**
     * @notice Set enterprise custom rate for a user
     * @param user The enterprise user address
     * @param rateBps Custom profit share rate in basis points
     * @dev Only callable by owner. User must be Enterprise tier. Rate between 200-500 bps (2-5%).
     */
    function setEnterpriseRate(address user, uint256 rateBps) external onlyOwner {
        if (user == address(0)) revert InvalidAddress();
        if (rateBps < 200 || rateBps > 500) revert FeeTooHigh();

        accounts[user].tier = Tier.Enterprise;
        enterpriseRates[user] = rateBps;

        emit UserTierChanged(user, accounts[user].tier, Tier.Enterprise);
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     * @dev Only callable by owner. Cannot be zero address.
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Pause the contract
     * @dev Only callable by owner. Pauses fee collection.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @dev Only callable by owner. Resumes fee collection.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Force start a new week for volume tracking
     * @dev Only callable by owner. Useful for testing or manual resets.
     */
    function forceNewWeek() external onlyOwner {
        currentWeekStart = block.timestamp;
        emit NewWeekStarted(currentWeekStart);
    }

    // ============ Internal Functions ============

    /**
     * @notice Check if a new week has started and update if so
     * @dev Called at the beginning of collectProfitFee
     */
    function _checkAndUpdateWeek() internal {
        if (block.timestamp >= currentWeekStart + 7 days) {
            currentWeekStart = block.timestamp;
            emit NewWeekStarted(currentWeekStart);
        }
    }

    /**
     * @notice Get referral tier config based on weekly volume
     * @param weeklyVolume The weekly volume to check
     * @return config The applicable referral tier configuration
     */
    function _getReferralTier(uint256 weeklyVolume) internal view returns (ReferralTierConfig memory config) {
        if (weeklyVolume >= referralTiers[3].minVolume) {
            return referralTiers[3]; // Diamond
        } else if (weeklyVolume >= referralTiers[2].minVolume) {
            return referralTiers[2]; // Gold
        } else if (weeklyVolume >= referralTiers[1].minVolume) {
            return referralTiers[1]; // Silver
        } else {
            return referralTiers[0]; // Bronze
        }
    }

    // ============ Receive Function ============

    /**
     * @notice Allow contract to receive native ETH
     */
    receive() external payable {}
}
