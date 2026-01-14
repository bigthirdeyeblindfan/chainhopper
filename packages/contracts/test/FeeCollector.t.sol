// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FeeCollector} from "../src/FeeCollector.sol";

/**
 * @title FeeCollector Test Suite
 * @notice Comprehensive tests for the FeeCollector contract
 */
contract FeeCollectorTest is Test {
    FeeCollector public feeCollector;

    address public treasury = makeAddr("treasury");
    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public referrer = makeAddr("referrer");

    function setUp() public {
        vm.prank(owner);
        feeCollector = new FeeCollector(treasury);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsTreasury() public view {
        assertEq(feeCollector.treasury(), treasury);
    }

    function test_Constructor_SetsOwner() public view {
        assertEq(feeCollector.owner(), owner);
    }

    function test_Constructor_SetsTierConfigs() public view {
        // Free tier: 15%
        (uint256 freeShareBps, bool freeActive) = feeCollector.tierConfigs(FeeCollector.Tier.Free);
        assertEq(freeShareBps, 1500);
        assertTrue(freeActive);

        // Holder tier: 10%
        (uint256 holderShareBps, bool holderActive) = feeCollector.tierConfigs(FeeCollector.Tier.Holder);
        assertEq(holderShareBps, 1000);
        assertTrue(holderActive);

        // Staker tier: 5%
        (uint256 stakerShareBps, bool stakerActive) = feeCollector.tierConfigs(FeeCollector.Tier.Staker);
        assertEq(stakerShareBps, 500);
        assertTrue(stakerActive);
    }

    function test_Constructor_RevertsOnZeroTreasury() public {
        vm.prank(owner);
        vm.expectRevert(FeeCollector.InvalidAddress.selector);
        new FeeCollector(address(0));
    }

    // ============ Referral Registration Tests ============

    function test_RegisterReferrer_Success() public {
        vm.prank(user1);
        feeCollector.registerReferrer(referrer);

        (address storedReferrer,,,,, ) = feeCollector.accounts(user1);
        assertEq(storedReferrer, referrer);
        assertEq(feeCollector.referralCount(referrer), 1);
    }

    function test_RegisterReferrer_RevertsOnZeroAddress() public {
        vm.prank(user1);
        vm.expectRevert(FeeCollector.InvalidAddress.selector);
        feeCollector.registerReferrer(address(0));
    }

    function test_RegisterReferrer_RevertsOnSelfRefer() public {
        vm.prank(user1);
        vm.expectRevert(FeeCollector.CannotSelfRefer.selector);
        feeCollector.registerReferrer(user1);
    }

    function test_RegisterReferrer_RevertsIfAlreadyHasReferrer() public {
        vm.startPrank(user1);
        feeCollector.registerReferrer(referrer);

        vm.expectRevert(FeeCollector.AlreadyHasReferrer.selector);
        feeCollector.registerReferrer(user2);
        vm.stopPrank();
    }

    // ============ Fee Calculation Tests ============

    function test_CalculateProfitFee_FreeTier() public view {
        uint256 profit = 1000 ether;

        (uint256 fee, uint256 netProfit, uint256 referralReward) = feeCollector.calculateProfitFee(user1, profit);

        // Free tier is 15% = 1500 bps
        assertEq(fee, 150 ether); // 15% of 1000
        assertEq(netProfit, 850 ether);
        assertEq(referralReward, 0); // No referrer
    }

    function test_CalculateProfitFee_WithReferrer() public {
        // Register referrer
        vm.prank(user1);
        feeCollector.registerReferrer(referrer);

        uint256 profit = 1000 ether;

        (uint256 fee, uint256 netProfit, uint256 referralReward) = feeCollector.calculateProfitFee(user1, profit);

        // Free tier: 15% minus 5% referee discount = 14.25%
        // 15% * (1 - 5%) = 15% * 95% = 14.25%
        // Referrer gets 20% of the fee
        uint256 expectedFee = (profit * 1425) / 10000; // 142.5 ether
        uint256 expectedReferralReward = (expectedFee * 2000) / 10000; // 20% of fee

        assertEq(fee, expectedFee);
        assertEq(netProfit, profit - fee);
        assertEq(referralReward, expectedReferralReward);
    }

    function test_CalculateProfitFee_HolderTier() public {
        // Set user to Holder tier
        vm.prank(owner);
        feeCollector.setUserTier(user1, FeeCollector.Tier.Holder);

        uint256 profit = 1000 ether;

        (uint256 fee, uint256 netProfit, ) = feeCollector.calculateProfitFee(user1, profit);

        // Holder tier is 10% = 1000 bps
        assertEq(fee, 100 ether);
        assertEq(netProfit, 900 ether);
    }

    function test_CalculateProfitFee_StakerTier() public {
        // Set user to Staker tier
        vm.prank(owner);
        feeCollector.setUserTier(user1, FeeCollector.Tier.Staker);

        uint256 profit = 1000 ether;

        (uint256 fee, uint256 netProfit, ) = feeCollector.calculateProfitFee(user1, profit);

        // Staker tier is 5% = 500 bps
        assertEq(fee, 50 ether);
        assertEq(netProfit, 950 ether);
    }

    // ============ Fee Collection Tests ============

    function test_CollectProfitFee_UpdatesAnalytics() public {
        uint256 profit = 1000 ether;

        vm.deal(address(feeCollector), profit);
        feeCollector.collectProfitFee(user1, address(0), profit);

        assertEq(feeCollector.totalVolume(), profit);
        assertEq(feeCollector.totalTrades(), 1);
        assertEq(feeCollector.totalProfitsProcessed(), profit);
        assertGt(feeCollector.totalFeesCollected(), 0);
    }

    function test_CollectProfitFee_UpdatesUserStats() public {
        uint256 profit = 1000 ether;

        vm.deal(address(feeCollector), profit);
        feeCollector.collectProfitFee(user1, address(0), profit);

        (,, uint256 weeklyVolume, uint256 totalVolume, uint256 totalProfitsPaid, uint256 totalFeesPaid) =
            feeCollector.accounts(user1);

        assertEq(weeklyVolume, profit);
        assertEq(totalVolume, profit);
        assertEq(totalProfitsPaid, profit);
        assertGt(totalFeesPaid, 0);
    }

    // ============ Admin Functions Tests ============

    function test_SetTierConfig_Success() public {
        vm.prank(owner);
        feeCollector.setTierConfig(FeeCollector.Tier.Free, 1000, true);

        (uint256 shareBps, bool active) = feeCollector.tierConfigs(FeeCollector.Tier.Free);
        assertEq(shareBps, 1000);
        assertTrue(active);
    }

    function test_SetTierConfig_RevertsIfFeeTooHigh() public {
        vm.prank(owner);
        vm.expectRevert(FeeCollector.FeeTooHigh.selector);
        feeCollector.setTierConfig(FeeCollector.Tier.Free, 2500, true); // 25% > 20% max
    }

    function test_SetTierConfig_RevertsIfNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        feeCollector.setTierConfig(FeeCollector.Tier.Free, 1000, true);
    }

    function test_SetUserTier_Success() public {
        vm.prank(owner);
        feeCollector.setUserTier(user1, FeeCollector.Tier.Holder);

        (, FeeCollector.Tier tier,,,, ) = feeCollector.accounts(user1);
        assertEq(uint256(tier), uint256(FeeCollector.Tier.Holder));
    }

    function test_SetEnterpriseRate_Success() public {
        vm.prank(owner);
        feeCollector.setEnterpriseRate(user1, 300); // 3%

        assertEq(feeCollector.enterpriseRates(user1), 300);

        (, FeeCollector.Tier tier,,,, ) = feeCollector.accounts(user1);
        assertEq(uint256(tier), uint256(FeeCollector.Tier.Enterprise));
    }

    function test_SetEnterpriseRate_RevertsIfOutOfRange() public {
        vm.startPrank(owner);

        // Too low (< 2%)
        vm.expectRevert(FeeCollector.FeeTooHigh.selector);
        feeCollector.setEnterpriseRate(user1, 100);

        // Too high (> 5%)
        vm.expectRevert(FeeCollector.FeeTooHigh.selector);
        feeCollector.setEnterpriseRate(user1, 600);

        vm.stopPrank();
    }

    function test_SetTreasury_Success() public {
        address newTreasury = makeAddr("newTreasury");

        vm.prank(owner);
        feeCollector.setTreasury(newTreasury);

        assertEq(feeCollector.treasury(), newTreasury);
    }

    function test_Pause_StopsCollectProfitFee() public {
        vm.prank(owner);
        feeCollector.pause();

        vm.expectRevert();
        feeCollector.collectProfitFee(user1, address(0), 1000 ether);
    }

    function test_Unpause_AllowsCollectProfitFee() public {
        vm.startPrank(owner);
        feeCollector.pause();
        feeCollector.unpause();
        vm.stopPrank();

        // Should not revert
        feeCollector.collectProfitFee(user1, address(0), 1000 ether);
    }

    // ============ Withdrawal Tests ============

    function test_WithdrawFees_ETH() public {
        // Send ETH to contract
        vm.deal(address(feeCollector), 10 ether);

        uint256 treasuryBalanceBefore = treasury.balance;

        vm.prank(owner);
        feeCollector.withdrawFees(address(0));

        assertEq(treasury.balance, treasuryBalanceBefore + 10 ether);
        assertEq(address(feeCollector).balance, 0);
    }

    function test_WithdrawFees_RevertsIfNotOwner() public {
        vm.deal(address(feeCollector), 10 ether);

        vm.prank(user1);
        vm.expectRevert();
        feeCollector.withdrawFees(address(0));
    }

    // ============ View Functions Tests ============

    function test_GetUserTierInfo() public {
        vm.prank(owner);
        feeCollector.setUserTier(user1, FeeCollector.Tier.Staker);

        (FeeCollector.Tier tier, uint256 profitShareBps) = feeCollector.getUserTierInfo(user1);

        assertEq(uint256(tier), uint256(FeeCollector.Tier.Staker));
        assertEq(profitShareBps, 500); // 5%
    }

    function test_GetReferralTierInfo() public view {
        // Diamond tier (> $200K)
        (uint256 tierIndex, FeeCollector.ReferralTierConfig memory config) =
            feeCollector.getReferralTierInfo(250_000 * 1e18);

        assertEq(tierIndex, 3); // Diamond
        assertEq(config.referrerShareBps, 3500); // 35%
    }

    function test_GetUserStats() public {
        vm.prank(user1);
        feeCollector.registerReferrer(referrer);

        (FeeCollector.UserAccount memory account, uint256 currentReferralTier) = feeCollector.getUserStats(user1);

        assertEq(account.referrer, referrer);
        assertEq(currentReferralTier, 0); // Bronze (0 volume)
    }

    // ============ Receive Function Test ============

    function test_ReceiveETH() public {
        vm.deal(user1, 1 ether);

        vm.prank(user1);
        (bool success,) = address(feeCollector).call{value: 1 ether}("");

        assertTrue(success);
        assertEq(address(feeCollector).balance, 1 ether);
    }
}
