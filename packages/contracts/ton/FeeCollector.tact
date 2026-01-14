// FeeCollector.tact
// SPDX-License-Identifier: MIT
//
// TON Fee Collector Contract for ChainHopper (Tact Version)
// Implements profit-share fee model with referral system
//
// Tier system (profit-share):
//   Free:       15% (1500 bps)
//   Holder:     10% (1000 bps) - 1,000 $HOPPER
//   Staker:      5% (500 bps)  - 10,000 veHOPPER
//   Enterprise:  2-5% custom
//
// Referral tiers (based on weekly volume):
//   Bronze:  <$10K   - 20% referrer share, 5% referee discount
//   Silver:  $10-50K - 25% referrer share, 7.5% referee discount
//   Gold:    $50-200K- 30% referrer share, 10% referee discount
//   Diamond: >$200K  - 35% referrer share, 10% referee discount

import "@stdlib/deploy";
import "@stdlib/ownable";

// ============ Constants ============

const BPS_DENOMINATOR: Int = 10000;
const MAX_FEE_BPS: Int = 2000;       // 20% max
const FREE_TIER_BPS: Int = 1500;     // 15%
const HOLDER_TIER_BPS: Int = 1000;   // 10%
const STAKER_TIER_BPS: Int = 500;    // 5%
const MIN_ENTERPRISE_BPS: Int = 200; // 2%
const MAX_ENTERPRISE_BPS: Int = 500; // 5%

// ============ Messages ============

/// Message to collect profit-share fee from a trade
message CollectFee {
    queryId: Int as uint64;
    user: Address;
    profitAmount: Int as coins;
    userTier: Int as uint8;
}

/// Message to register a referrer for the sender
message RegisterReferrer {
    queryId: Int as uint64;
    referrer: Address;
}

/// Message to claim accumulated referral earnings
message ClaimReferral {
    queryId: Int as uint64;
}

/// Message to withdraw collected fees to treasury (owner only)
message WithdrawFees {
    queryId: Int as uint64;
    amount: Int as coins;
}

/// Message to update the platform fee (owner only)
message UpdateFee {
    queryId: Int as uint64;
    newFeeBps: Int as uint16;
}

/// Message to set treasury address (owner only)
message SetTreasury {
    queryId: Int as uint64;
    newTreasury: Address;
}

/// Message to set a user's tier (owner only)
message SetUserTier {
    queryId: Int as uint64;
    user: Address;
    tier: Int as uint8;
}

/// Message to set enterprise custom rate (owner only)
message SetEnterpriseRate {
    queryId: Int as uint64;
    user: Address;
    rateBps: Int as uint16;
}

/// Message to pause the contract (owner only)
message Pause {
    queryId: Int as uint64;
}

/// Message to unpause the contract (owner only)
message Unpause {
    queryId: Int as uint64;
}

/// Response message with fee calculation results
message FeeCollectedResponse {
    queryId: Int as uint64;
    fee: Int as coins;
    netProfit: Int as coins;
    referralReward: Int as coins;
}

// ============ Structs ============

/// Referral tier configuration
struct ReferralTierConfig {
    minVolume: Int as coins;
    referrerShareBps: Int as uint16;
    refereeDiscountBps: Int as uint16;
}

/// User account data
struct UserAccount {
    referrer: Address?;
    tier: Int as uint8;
    weeklyVolume: Int as coins;
    totalVolume: Int as coins;
    totalFeesPaid: Int as coins;
    referralEarnings: Int as coins;
}

// ============ Contract ============

contract FeeCollector with Deployable, Ownable {
    // Owner address (from Ownable trait)
    owner: Address;

    // Treasury address for fee withdrawals
    treasury: Address;

    // Platform fee in basis points (default: FREE_TIER_BPS)
    platformFeeBps: Int as uint16;

    // Contract paused state
    isPaused: Bool;

    // Analytics
    totalVolume: Int as coins;
    totalFees: Int as coins;
    totalTrades: Int as uint64;
    totalReferralsPaid: Int as coins;

    // Week start timestamp for volume tracking
    currentWeekStart: Int as uint32;

    // User referrals mapping (user -> referrer)
    referrals: map<Address, Address>;

    // User tiers mapping (user -> tier)
    userTiers: map<Address, Int>;

    // Enterprise custom rates (user -> rateBps)
    enterpriseRates: map<Address, Int>;

    // User weekly volumes (user -> volume)
    weeklyVolumes: map<Address, Int>;

    // Referral earnings (user -> earnings)
    referralEarnings: map<Address, Int>;

    // Referral counts (referrer -> count)
    referralCounts: map<Address, Int>;

    /// Initialize the FeeCollector contract
    /// @param treasury Address to receive collected fees
    init(treasury: Address) {
        self.owner = sender();
        self.treasury = treasury;
        self.platformFeeBps = FREE_TIER_BPS;
        self.isPaused = false;
        self.totalVolume = 0;
        self.totalFees = 0;
        self.totalTrades = 0;
        self.totalReferralsPaid = 0;
        self.currentWeekStart = now();
    }

    // ============ Receive Handlers ============

    /// Collect profit-share fee from a trade
    receive(msg: CollectFee) {
        require(!self.isPaused, "Contract is paused");

        // Get user's tier fee rate
        let tierBps: Int = self.getTierFee(msg.user, msg.userTier);

        // Check for referrer
        let referrer: Address? = self.referrals.get(msg.user);
        let fee: Int = 0;
        let referralReward: Int = 0;

        if (referrer != null) {
            // Get referrer's volume for tier calculation
            let referrerVolume: Int = self.weeklyVolumes.get(referrer!!) != null
                ? self.weeklyVolumes.get(referrer!!)!!
                : 0;

            // Get referral tier config
            let refTier: ReferralTierConfig = self.getReferralTier(referrerVolume);

            // Apply referee discount
            let discount: Int = (tierBps * refTier.refereeDiscountBps) / BPS_DENOMINATOR;
            let effectiveBps: Int = tierBps - discount;

            // Calculate fee
            fee = (msg.profitAmount * effectiveBps) / BPS_DENOMINATOR;

            // Calculate referral reward
            referralReward = (fee * refTier.referrerShareBps) / BPS_DENOMINATOR;

            // Update referrer earnings
            let currentEarnings: Int = self.referralEarnings.get(referrer!!) != null
                ? self.referralEarnings.get(referrer!!)!!
                : 0;
            self.referralEarnings.set(referrer!!, currentEarnings + referralReward);
            self.totalReferralsPaid = self.totalReferralsPaid + referralReward;
        } else {
            fee = (msg.profitAmount * tierBps) / BPS_DENOMINATOR;
        }

        let netProfit: Int = msg.profitAmount - fee;

        // Update user weekly volume
        let userVolume: Int = self.weeklyVolumes.get(msg.user) != null
            ? self.weeklyVolumes.get(msg.user)!!
            : 0;
        self.weeklyVolumes.set(msg.user, userVolume + msg.profitAmount);

        // Update analytics
        self.totalVolume = self.totalVolume + msg.profitAmount;
        self.totalFees = self.totalFees + fee;
        self.totalTrades = self.totalTrades + 1;

        // Send response
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            body: FeeCollectedResponse{
                queryId: msg.queryId,
                fee: fee,
                netProfit: netProfit,
                referralReward: referralReward
            }.toCell()
        });
    }

    /// Register a referrer for the sender
    receive(msg: RegisterReferrer) {
        require(self.referrals.get(sender()) == null, "Already has referrer");
        require(msg.referrer != sender(), "Cannot self-refer");

        self.referrals.set(sender(), msg.referrer);

        // Increment referral count
        let count: Int = self.referralCounts.get(msg.referrer) != null
            ? self.referralCounts.get(msg.referrer)!!
            : 0;
        self.referralCounts.set(msg.referrer, count + 1);
    }

    /// Claim accumulated referral earnings
    receive(msg: ClaimReferral) {
        let earnings: Int = self.referralEarnings.get(sender()) != null
            ? self.referralEarnings.get(sender())!!
            : 0;
        require(earnings > 0, "No earnings to claim");

        self.referralEarnings.set(sender(), 0);

        send(SendParameters{
            to: sender(),
            value: earnings,
            mode: SendRemainingValue,
            body: "Referral earnings claimed".asComment()
        });
    }

    /// Withdraw collected fees to treasury (owner only)
    receive(msg: WithdrawFees) {
        self.requireOwner();

        let balance: Int = myBalance();
        require(balance >= msg.amount + ton("0.1"), "Insufficient balance");

        send(SendParameters{
            to: self.treasury,
            value: msg.amount,
            mode: SendIgnoreErrors,
            body: "Fee withdrawal".asComment()
        });
    }

    /// Update platform fee (owner only)
    receive(msg: UpdateFee) {
        self.requireOwner();
        require(msg.newFeeBps <= MAX_FEE_BPS, "Fee too high");

        self.platformFeeBps = msg.newFeeBps;
    }

    /// Set treasury address (owner only)
    receive(msg: SetTreasury) {
        self.requireOwner();
        self.treasury = msg.newTreasury;
    }

    /// Set user tier (owner only)
    receive(msg: SetUserTier) {
        self.requireOwner();
        require(msg.tier >= 0 && msg.tier <= 3, "Invalid tier");

        self.userTiers.set(msg.user, msg.tier);
    }

    /// Set enterprise custom rate (owner only)
    receive(msg: SetEnterpriseRate) {
        self.requireOwner();
        require(msg.rateBps >= MIN_ENTERPRISE_BPS && msg.rateBps <= MAX_ENTERPRISE_BPS,
                "Rate must be between 2-5%");

        self.userTiers.set(msg.user, 3); // Set to enterprise tier
        self.enterpriseRates.set(msg.user, msg.rateBps);
    }

    /// Pause contract (owner only)
    receive(msg: Pause) {
        self.requireOwner();
        self.isPaused = true;
    }

    /// Unpause contract (owner only)
    receive(msg: Unpause) {
        self.requireOwner();
        self.isPaused = false;
    }

    /// Allow receiving TON
    receive() {
        // Accept incoming TON transfers
    }

    // ============ Internal Functions ============

    /// Get tier fee in basis points for a user
    fun getTierFee(user: Address, defaultTier: Int): Int {
        let storedTier: Int? = self.userTiers.get(user);
        let tier: Int = storedTier != null ? storedTier!! : defaultTier;

        if (tier == 3) {
            // Enterprise tier - check for custom rate
            let customRate: Int? = self.enterpriseRates.get(user);
            if (customRate != null) {
                return customRate!!;
            }
            return MAX_ENTERPRISE_BPS;
        }

        if (tier == 2) {
            return STAKER_TIER_BPS;
        }

        if (tier == 1) {
            return HOLDER_TIER_BPS;
        }

        return FREE_TIER_BPS;
    }

    /// Get referral tier configuration based on weekly volume
    fun getReferralTier(weeklyVolume: Int): ReferralTierConfig {
        // Diamond: >$200K (assuming 1 TON = $1 for simplicity, adjust as needed)
        if (weeklyVolume >= ton("200000")) {
            return ReferralTierConfig{
                minVolume: ton("200000"),
                referrerShareBps: 3500,   // 35%
                refereeDiscountBps: 1000  // 10%
            };
        }

        // Gold: $50K-$200K
        if (weeklyVolume >= ton("50000")) {
            return ReferralTierConfig{
                minVolume: ton("50000"),
                referrerShareBps: 3000,   // 30%
                refereeDiscountBps: 1000  // 10%
            };
        }

        // Silver: $10K-$50K
        if (weeklyVolume >= ton("10000")) {
            return ReferralTierConfig{
                minVolume: ton("10000"),
                referrerShareBps: 2500,   // 25%
                refereeDiscountBps: 750   // 7.5%
            };
        }

        // Bronze: <$10K
        return ReferralTierConfig{
            minVolume: 0,
            referrerShareBps: 2000,   // 20%
            refereeDiscountBps: 500   // 5%
        };
    }

    // ============ Getter Functions ============

    /// Get contract configuration
    get fun getConfig(): (Address, Address, Int, Bool) {
        return (self.owner, self.treasury, self.platformFeeBps, self.isPaused);
    }

    /// Get analytics
    get fun getStats(): (Int, Int, Int, Int) {
        return (self.totalVolume, self.totalFees, self.totalTrades, self.totalReferralsPaid);
    }

    /// Calculate fee for a given amount and tier (for UI)
    get fun calculateFee(amount: Int, tier: Int): (Int, Int) {
        let tierBps: Int = FREE_TIER_BPS;

        if (tier == 3) {
            tierBps = MAX_ENTERPRISE_BPS;
        } else if (tier == 2) {
            tierBps = STAKER_TIER_BPS;
        } else if (tier == 1) {
            tierBps = HOLDER_TIER_BPS;
        }

        let fee: Int = (amount * tierBps) / BPS_DENOMINATOR;
        return (fee, amount - fee);
    }

    /// Get tier fee rate in basis points
    get fun getTierRate(tier: Int): Int {
        if (tier == 3) {
            return MAX_ENTERPRISE_BPS;
        }
        if (tier == 2) {
            return STAKER_TIER_BPS;
        }
        if (tier == 1) {
            return HOLDER_TIER_BPS;
        }
        return FREE_TIER_BPS;
    }

    /// Check if user has a referrer
    get fun hasReferrer(user: Address): Bool {
        return self.referrals.get(user) != null;
    }

    /// Get referrer for a user
    get fun getReferrer(user: Address): Address? {
        return self.referrals.get(user);
    }

    /// Get referral earnings for a user
    get fun getReferralEarnings(user: Address): Int {
        let earnings: Int? = self.referralEarnings.get(user);
        return earnings != null ? earnings!! : 0;
    }

    /// Get referral count for a referrer
    get fun getReferralCount(referrer: Address): Int {
        let count: Int? = self.referralCounts.get(referrer);
        return count != null ? count!! : 0;
    }

    /// Get user's weekly volume
    get fun getWeeklyVolume(user: Address): Int {
        let volume: Int? = self.weeklyVolumes.get(user);
        return volume != null ? volume!! : 0;
    }

    /// Get user's tier
    get fun getUserTier(user: Address): Int {
        let tier: Int? = self.userTiers.get(user);
        return tier != null ? tier!! : 0;
    }
}
