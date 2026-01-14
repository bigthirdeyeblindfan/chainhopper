// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IReferralRegistry
 * @notice Interface for the ReferralRegistry contract
 * @dev Provides referral code management and relationship tracking
 */
interface IReferralRegistry {
    /// @notice Referral tier levels based on performance
    enum ReferralTier {
        Bronze,   // < $10K weekly volume
        Silver,   // $10K - $50K weekly volume
        Gold,     // $50K - $200K weekly volume
        Diamond   // > $200K weekly volume
    }

    /// @notice Referrer statistics
    struct ReferrerStats {
        uint256 totalReferrals;
        uint256 activeReferrals;
        uint256 totalVolume;
        uint256 weeklyVolume;
        uint256 totalEarnings;
        uint256 pendingEarnings;
        ReferralTier tier;
    }

    /**
     * @notice Register a referral code for the caller
     * @param code The unique referral code to register
     */
    function registerCode(bytes32 code) external;

    /**
     * @notice Use a referral code to set the caller's referrer
     * @param code The referral code to use
     */
    function useCode(bytes32 code) external;

    /**
     * @notice Get the referrer for a user
     * @param user The user address
     * @return The referrer address (address(0) if none)
     */
    function getReferrer(address user) external view returns (address);

    /**
     * @notice Get the referral code owner
     * @param code The referral code
     * @return The owner address (address(0) if not registered)
     */
    function getCodeOwner(bytes32 code) external view returns (address);

    /**
     * @notice Get referrer statistics
     * @param referrer The referrer address
     * @return stats The referrer's statistics
     */
    function getReferrerStats(address referrer) external view returns (ReferrerStats memory stats);

    /**
     * @notice Record volume attributed to a referral
     * @param user The user who generated the volume
     * @param volume The volume amount
     */
    function recordVolume(address user, uint256 volume) external;

    /**
     * @notice Record earnings for a referrer
     * @param referrer The referrer address
     * @param amount The earnings amount
     */
    function recordEarnings(address referrer, uint256 amount) external;
}
