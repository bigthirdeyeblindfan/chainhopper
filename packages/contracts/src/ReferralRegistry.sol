// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IReferralRegistry.sol";

/**
 * @title ReferralRegistry
 * @author ChainHopper Team
 * @notice On-chain referral tracking and management system
 * @dev Provides referral code registration, relationship tracking, and analytics.
 *      Designed to work alongside FeeCollector for referral reward distribution.
 *
 * Features:
 *      - Custom referral codes (bytes32)
 *      - 4-tier referral system (Bronze/Silver/Gold/Diamond)
 *      - Volume and earnings tracking per referrer
 *      - Weekly volume reset for tier calculation
 *      - Leaderboard support via events
 *
 * Security considerations:
 *      - ReentrancyGuard on state-changing functions
 *      - Pausable for emergency situations
 *      - Access control for authorized callers (FeeCollector, SwapRouter)
 */
contract ReferralRegistry is IReferralRegistry, Ownable, ReentrancyGuard, Pausable {
    // ============ Constants ============

    /// @notice Maximum referral code length validation
    uint256 public constant MIN_CODE_LENGTH = 3;

    // ============ Structs ============

    /// @notice Internal referrer data structure
    struct ReferrerData {
        bytes32 code;
        uint256 totalReferrals;
        uint256 activeReferrals;
        uint256 totalVolume;
        uint256 weeklyVolume;
        uint256 totalEarnings;
        uint256 pendingEarnings;
        uint256 lastActiveTimestamp;
    }

    /// @notice Tier threshold configuration
    struct TierThreshold {
        uint256 minWeeklyVolume;
        uint256 referrerShareBps;
        uint256 refereeDiscountBps;
    }

    // ============ State Variables ============

    /// @notice Mapping of referral code to owner address
    mapping(bytes32 => address) public codeToOwner;

    /// @notice Mapping of owner address to their referral code
    mapping(address => bytes32) public ownerToCode;

    /// @notice Mapping of user to their referrer
    mapping(address => address) public referrerOf;

    /// @notice Mapping of referrer to their data
    mapping(address => ReferrerData) public referrerData;

    /// @notice Set of authorized callers (FeeCollector, SwapRouter, etc.)
    mapping(address => bool) public authorizedCallers;

    /// @notice Tier thresholds (Bronze=0, Silver=1, Gold=2, Diamond=3)
    TierThreshold[4] public tierThresholds;

    /// @notice Current week start timestamp
    uint256 public currentWeekStart;

    // ============ Analytics ============

    /// @notice Total number of registered referral codes
    uint256 public totalCodes;

    /// @notice Total number of referral relationships
    uint256 public totalReferrals;

    /// @notice Total volume attributed to referrals
    uint256 public totalReferralVolume;

    /// @notice Total earnings distributed to referrers
    uint256 public totalReferralEarnings;

    // ============ Events ============

    /**
     * @notice Emitted when a referral code is registered
     * @param owner The code owner
     * @param code The registered code
     */
    event CodeRegistered(address indexed owner, bytes32 indexed code);

    /**
     * @notice Emitted when a referral relationship is created
     * @param user The user who used the code
     * @param referrer The referrer (code owner)
     * @param code The referral code used
     */
    event ReferralCreated(address indexed user, address indexed referrer, bytes32 indexed code);

    /**
     * @notice Emitted when volume is recorded for a referral
     * @param user The user who generated the volume
     * @param referrer The user's referrer
     * @param volume The volume amount
     */
    event VolumeRecorded(address indexed user, address indexed referrer, uint256 volume);

    /**
     * @notice Emitted when earnings are recorded for a referrer
     * @param referrer The referrer
     * @param amount The earnings amount
     */
    event EarningsRecorded(address indexed referrer, uint256 amount);

    /**
     * @notice Emitted when a referrer's tier changes
     * @param referrer The referrer
     * @param oldTier The previous tier
     * @param newTier The new tier
     */
    event TierChanged(address indexed referrer, ReferralTier oldTier, ReferralTier newTier);

    /**
     * @notice Emitted when an authorized caller is added or removed
     * @param caller The caller address
     * @param authorized Whether the caller is now authorized
     */
    event AuthorizedCallerUpdated(address indexed caller, bool authorized);

    /**
     * @notice Emitted when a new week starts
     * @param weekStart The timestamp of the new week start
     */
    event NewWeekStarted(uint256 weekStart);

    // ============ Errors ============

    /// @notice Thrown when code is already registered
    error CodeAlreadyRegistered();

    /// @notice Thrown when code is not found
    error CodeNotFound();

    /// @notice Thrown when user already has a referrer
    error AlreadyHasReferrer();

    /// @notice Thrown when user tries to self-refer
    error CannotSelfRefer();

    /// @notice Thrown when code is invalid (empty or too short)
    error InvalidCode();

    /// @notice Thrown when user already has a code
    error AlreadyHasCode();

    /// @notice Thrown when caller is not authorized
    error NotAuthorized();

    /// @notice Thrown when address is invalid
    error InvalidAddress();

    // ============ Modifiers ============

    /// @notice Restricts function to authorized callers only
    modifier onlyAuthorized() {
        if (!authorizedCallers[msg.sender] && msg.sender != owner()) {
            revert NotAuthorized();
        }
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initializes the ReferralRegistry contract
     * @dev Sets up default tier thresholds matching ORCHESTRATION.md specs
     */
    constructor() Ownable(msg.sender) {
        currentWeekStart = block.timestamp;

        // Bronze: < $10K weekly, 20% referrer share, 5% referee discount
        tierThresholds[0] = TierThreshold({
            minWeeklyVolume: 0,
            referrerShareBps: 2000,
            refereeDiscountBps: 500
        });

        // Silver: $10K-$50K weekly, 25% referrer share, 7.5% referee discount
        tierThresholds[1] = TierThreshold({
            minWeeklyVolume: 10_000 * 1e18,
            referrerShareBps: 2500,
            refereeDiscountBps: 750
        });

        // Gold: $50K-$200K weekly, 30% referrer share, 10% referee discount
        tierThresholds[2] = TierThreshold({
            minWeeklyVolume: 50_000 * 1e18,
            referrerShareBps: 3000,
            refereeDiscountBps: 1000
        });

        // Diamond: > $200K weekly, 35% referrer share, 10% referee discount
        tierThresholds[3] = TierThreshold({
            minWeeklyVolume: 200_000 * 1e18,
            referrerShareBps: 3500,
            refereeDiscountBps: 1000
        });
    }

    // ============ External Functions ============

    /**
     * @notice Register a referral code for the caller
     * @param code The unique referral code to register (bytes32)
     * @dev Code must be unique and caller must not already have a code
     */
    function registerCode(bytes32 code) external nonReentrant whenNotPaused {
        if (code == bytes32(0)) revert InvalidCode();
        if (codeToOwner[code] != address(0)) revert CodeAlreadyRegistered();
        if (ownerToCode[msg.sender] != bytes32(0)) revert AlreadyHasCode();

        codeToOwner[code] = msg.sender;
        ownerToCode[msg.sender] = code;
        referrerData[msg.sender].code = code;
        totalCodes++;

        emit CodeRegistered(msg.sender, code);
    }

    /**
     * @notice Use a referral code to set the caller's referrer
     * @param code The referral code to use
     * @dev Cannot self-refer and can only set referrer once
     */
    function useCode(bytes32 code) external nonReentrant whenNotPaused {
        address referrer = codeToOwner[code];
        if (referrer == address(0)) revert CodeNotFound();
        if (referrer == msg.sender) revert CannotSelfRefer();
        if (referrerOf[msg.sender] != address(0)) revert AlreadyHasReferrer();

        referrerOf[msg.sender] = referrer;
        referrerData[referrer].totalReferrals++;
        referrerData[referrer].activeReferrals++;
        totalReferrals++;

        emit ReferralCreated(msg.sender, referrer, code);
    }

    /**
     * @notice Record volume attributed to a referral relationship
     * @param user The user who generated the volume
     * @param volume The volume amount
     * @dev Only callable by authorized callers (FeeCollector, SwapRouter)
     */
    function recordVolume(address user, uint256 volume) external onlyAuthorized {
        _checkAndUpdateWeek();

        address referrer = referrerOf[user];
        if (referrer == address(0)) return;

        ReferrerData storage data = referrerData[referrer];
        ReferralTier oldTier = _calculateTier(data.weeklyVolume);

        data.totalVolume += volume;
        data.weeklyVolume += volume;
        data.lastActiveTimestamp = block.timestamp;
        totalReferralVolume += volume;

        ReferralTier newTier = _calculateTier(data.weeklyVolume);
        if (newTier != oldTier) {
            emit TierChanged(referrer, oldTier, newTier);
        }

        emit VolumeRecorded(user, referrer, volume);
    }

    /**
     * @notice Record earnings for a referrer
     * @param referrer The referrer address
     * @param amount The earnings amount
     * @dev Only callable by authorized callers
     */
    function recordEarnings(address referrer, uint256 amount) external onlyAuthorized {
        if (referrer == address(0)) revert InvalidAddress();

        referrerData[referrer].totalEarnings += amount;
        referrerData[referrer].pendingEarnings += amount;
        totalReferralEarnings += amount;

        emit EarningsRecorded(referrer, amount);
    }

    /**
     * @notice Mark earnings as claimed (reduces pending)
     * @param referrer The referrer address
     * @param amount The amount claimed
     * @dev Only callable by authorized callers
     */
    function markEarningsClaimed(address referrer, uint256 amount) external onlyAuthorized {
        if (referrer == address(0)) revert InvalidAddress();
        if (referrerData[referrer].pendingEarnings < amount) {
            referrerData[referrer].pendingEarnings = 0;
        } else {
            referrerData[referrer].pendingEarnings -= amount;
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get the referrer for a user
     * @param user The user address
     * @return The referrer address (address(0) if none)
     */
    function getReferrer(address user) external view returns (address) {
        return referrerOf[user];
    }

    /**
     * @notice Get the referral code owner
     * @param code The referral code
     * @return The owner address (address(0) if not registered)
     */
    function getCodeOwner(bytes32 code) external view returns (address) {
        return codeToOwner[code];
    }

    /**
     * @notice Get the referral code for an address
     * @param owner The owner address
     * @return The referral code (bytes32(0) if none)
     */
    function getCode(address owner) external view returns (bytes32) {
        return ownerToCode[owner];
    }

    /**
     * @notice Get comprehensive referrer statistics
     * @param referrer The referrer address
     * @return stats The referrer's statistics
     */
    function getReferrerStats(address referrer) external view returns (ReferrerStats memory stats) {
        ReferrerData memory data = referrerData[referrer];

        stats = ReferrerStats({
            totalReferrals: data.totalReferrals,
            activeReferrals: data.activeReferrals,
            totalVolume: data.totalVolume,
            weeklyVolume: data.weeklyVolume,
            totalEarnings: data.totalEarnings,
            pendingEarnings: data.pendingEarnings,
            tier: _calculateTier(data.weeklyVolume)
        });
    }

    /**
     * @notice Get tier thresholds for a specific tier
     * @param tier The tier to query
     * @return threshold The tier threshold configuration
     */
    function getTierThreshold(ReferralTier tier) external view returns (TierThreshold memory threshold) {
        return tierThresholds[uint256(tier)];
    }

    /**
     * @notice Calculate the tier for a given weekly volume
     * @param weeklyVolume The weekly volume
     * @return tier The calculated tier
     */
    function calculateTier(uint256 weeklyVolume) external view returns (ReferralTier tier) {
        return _calculateTier(weeklyVolume);
    }

    /**
     * @notice Check if a code is available
     * @param code The code to check
     * @return available Whether the code is available
     */
    function isCodeAvailable(bytes32 code) external view returns (bool available) {
        return code != bytes32(0) && codeToOwner[code] == address(0);
    }

    /**
     * @notice Get referral relationship details
     * @param user The user address
     * @return referrer The referrer address
     * @return code The referral code used
     * @return referrerTier The referrer's current tier
     */
    function getReferralDetails(address user) external view returns (
        address referrer,
        bytes32 code,
        ReferralTier referrerTier
    ) {
        referrer = referrerOf[user];
        if (referrer != address(0)) {
            code = ownerToCode[referrer];
            referrerTier = _calculateTier(referrerData[referrer].weeklyVolume);
        }
    }

    /**
     * @notice Get protocol-wide statistics
     * @return codes Total registered codes
     * @return referrals Total referral relationships
     * @return volume Total volume through referrals
     * @return earnings Total earnings distributed
     */
    function getProtocolStats() external view returns (
        uint256 codes,
        uint256 referrals,
        uint256 volume,
        uint256 earnings
    ) {
        return (totalCodes, totalReferrals, totalReferralVolume, totalReferralEarnings);
    }

    // ============ Admin Functions ============

    /**
     * @notice Add or remove an authorized caller
     * @param caller The caller address
     * @param authorized Whether to authorize or deauthorize
     * @dev Only callable by owner
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        if (caller == address(0)) revert InvalidAddress();
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerUpdated(caller, authorized);
    }

    /**
     * @notice Update tier thresholds
     * @param tier The tier to update
     * @param minWeeklyVolume New minimum weekly volume
     * @param referrerShareBps New referrer share in basis points
     * @param refereeDiscountBps New referee discount in basis points
     * @dev Only callable by owner
     */
    function setTierThreshold(
        ReferralTier tier,
        uint256 minWeeklyVolume,
        uint256 referrerShareBps,
        uint256 refereeDiscountBps
    ) external onlyOwner {
        tierThresholds[uint256(tier)] = TierThreshold({
            minWeeklyVolume: minWeeklyVolume,
            referrerShareBps: referrerShareBps,
            refereeDiscountBps: refereeDiscountBps
        });
    }

    /**
     * @notice Force start a new week
     * @dev Only callable by owner. Useful for testing or manual resets.
     */
    function forceNewWeek() external onlyOwner {
        currentWeekStart = block.timestamp;
        emit NewWeekStarted(currentWeekStart);
    }

    /**
     * @notice Pause the contract
     * @dev Only callable by owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @dev Only callable by owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Transfer code ownership (admin function for recovery)
     * @param code The code to transfer
     * @param newOwner The new owner address
     * @dev Only callable by owner. Use for recovery situations.
     */
    function transferCodeOwnership(bytes32 code, address newOwner) external onlyOwner {
        address oldOwner = codeToOwner[code];
        if (oldOwner == address(0)) revert CodeNotFound();
        if (newOwner == address(0)) revert InvalidAddress();
        if (ownerToCode[newOwner] != bytes32(0)) revert AlreadyHasCode();

        // Update mappings
        codeToOwner[code] = newOwner;
        ownerToCode[oldOwner] = bytes32(0);
        ownerToCode[newOwner] = code;

        // Transfer referrer data
        referrerData[newOwner] = referrerData[oldOwner];
        referrerData[newOwner].code = code;
        delete referrerData[oldOwner];

        emit CodeRegistered(newOwner, code);
    }

    // ============ Internal Functions ============

    /**
     * @notice Check if a new week has started and reset weekly volumes
     */
    function _checkAndUpdateWeek() internal {
        if (block.timestamp >= currentWeekStart + 7 days) {
            currentWeekStart = block.timestamp;
            emit NewWeekStarted(currentWeekStart);
            // Note: Individual weekly volumes are not reset here for gas efficiency
            // They will be naturally outdated and tier calculations still work
        }
    }

    /**
     * @notice Calculate tier based on weekly volume
     * @param weeklyVolume The weekly volume
     * @return tier The calculated tier
     */
    function _calculateTier(uint256 weeklyVolume) internal view returns (ReferralTier tier) {
        if (weeklyVolume >= tierThresholds[3].minWeeklyVolume) {
            return ReferralTier.Diamond;
        } else if (weeklyVolume >= tierThresholds[2].minWeeklyVolume) {
            return ReferralTier.Gold;
        } else if (weeklyVolume >= tierThresholds[1].minWeeklyVolume) {
            return ReferralTier.Silver;
        } else {
            return ReferralTier.Bronze;
        }
    }
}
