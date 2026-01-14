// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ReferralRegistry} from "../src/ReferralRegistry.sol";
import {IReferralRegistry} from "../src/interfaces/IReferralRegistry.sol";

/**
 * @title ReferralRegistry Test Suite
 * @notice Comprehensive tests for the ReferralRegistry contract
 */
contract ReferralRegistryTest is Test {
    ReferralRegistry public registry;

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
    address public authorizedCaller = makeAddr("authorizedCaller");

    bytes32 public constant CODE_1 = keccak256("REFERRAL1");
    bytes32 public constant CODE_2 = keccak256("REFERRAL2");
    bytes32 public constant CODE_3 = keccak256("REFERRAL3");

    function setUp() public {
        vm.prank(owner);
        registry = new ReferralRegistry();

        // Authorize a caller
        vm.prank(owner);
        registry.setAuthorizedCaller(authorizedCaller, true);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsOwner() public view {
        assertEq(registry.owner(), owner);
    }

    function test_Constructor_InitializesTierThresholds() public view {
        // Bronze
        (uint256 minVol0, uint256 share0, uint256 discount0) = registry.tierThresholds(0);
        assertEq(minVol0, 0);
        assertEq(share0, 2000);
        assertEq(discount0, 500);

        // Silver
        (uint256 minVol1, uint256 share1, uint256 discount1) = registry.tierThresholds(1);
        assertEq(minVol1, 10_000 * 1e18);
        assertEq(share1, 2500);
        assertEq(discount1, 750);

        // Gold
        (uint256 minVol2, uint256 share2, uint256 discount2) = registry.tierThresholds(2);
        assertEq(minVol2, 50_000 * 1e18);
        assertEq(share2, 3000);
        assertEq(discount2, 1000);

        // Diamond
        (uint256 minVol3, uint256 share3, uint256 discount3) = registry.tierThresholds(3);
        assertEq(minVol3, 200_000 * 1e18);
        assertEq(share3, 3500);
        assertEq(discount3, 1000);
    }

    // ============ Code Registration Tests ============

    function test_RegisterCode_Success() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        assertEq(registry.codeToOwner(CODE_1), user1);
        assertEq(registry.ownerToCode(user1), CODE_1);
        assertEq(registry.totalCodes(), 1);
    }

    function test_RegisterCode_EmitsEvent() public {
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit ReferralRegistry.CodeRegistered(user1, CODE_1);
        registry.registerCode(CODE_1);
    }

    function test_RegisterCode_RevertsOnEmptyCode() public {
        vm.prank(user1);
        vm.expectRevert(ReferralRegistry.InvalidCode.selector);
        registry.registerCode(bytes32(0));
    }

    function test_RegisterCode_RevertsOnDuplicateCode() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        vm.prank(user2);
        vm.expectRevert(ReferralRegistry.CodeAlreadyRegistered.selector);
        registry.registerCode(CODE_1);
    }

    function test_RegisterCode_RevertsIfUserAlreadyHasCode() public {
        vm.startPrank(user1);
        registry.registerCode(CODE_1);

        vm.expectRevert(ReferralRegistry.AlreadyHasCode.selector);
        registry.registerCode(CODE_2);
        vm.stopPrank();
    }

    // ============ Use Code Tests ============

    function test_UseCode_Success() public {
        // User1 registers code
        vm.prank(user1);
        registry.registerCode(CODE_1);

        // User2 uses code
        vm.prank(user2);
        registry.useCode(CODE_1);

        assertEq(registry.referrerOf(user2), user1);
        assertEq(registry.totalReferrals(), 1);
    }

    function test_UseCode_UpdatesReferrerData() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        vm.prank(user2);
        registry.useCode(CODE_1);

        IReferralRegistry.ReferrerStats memory stats = registry.getReferrerStats(user1);
        assertEq(stats.totalReferrals, 1);
        assertEq(stats.activeReferrals, 1);
    }

    function test_UseCode_EmitsEvent() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        vm.prank(user2);
        vm.expectEmit(true, true, true, true);
        emit ReferralRegistry.ReferralCreated(user2, user1, CODE_1);
        registry.useCode(CODE_1);
    }

    function test_UseCode_RevertsOnNonexistentCode() public {
        vm.prank(user2);
        vm.expectRevert(ReferralRegistry.CodeNotFound.selector);
        registry.useCode(CODE_1);
    }

    function test_UseCode_RevertsOnSelfRefer() public {
        vm.startPrank(user1);
        registry.registerCode(CODE_1);

        vm.expectRevert(ReferralRegistry.CannotSelfRefer.selector);
        registry.useCode(CODE_1);
        vm.stopPrank();
    }

    function test_UseCode_RevertsIfAlreadyHasReferrer() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        vm.prank(user3);
        registry.registerCode(CODE_2);

        vm.startPrank(user2);
        registry.useCode(CODE_1);

        vm.expectRevert(ReferralRegistry.AlreadyHasReferrer.selector);
        registry.useCode(CODE_2);
        vm.stopPrank();
    }

    // ============ Volume Recording Tests ============

    function test_RecordVolume_Success() public {
        // Setup referral
        vm.prank(user1);
        registry.registerCode(CODE_1);
        vm.prank(user2);
        registry.useCode(CODE_1);

        // Record volume
        vm.prank(authorizedCaller);
        registry.recordVolume(user2, 1000 ether);

        IReferralRegistry.ReferrerStats memory stats = registry.getReferrerStats(user1);
        assertEq(stats.totalVolume, 1000 ether);
        assertEq(stats.weeklyVolume, 1000 ether);
        assertEq(registry.totalReferralVolume(), 1000 ether);
    }

    function test_RecordVolume_UpdatesTier() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);
        vm.prank(user2);
        registry.useCode(CODE_1);

        // Start at Bronze
        IReferralRegistry.ReferrerStats memory stats = registry.getReferrerStats(user1);
        assertEq(uint256(stats.tier), uint256(IReferralRegistry.ReferralTier.Bronze));

        // Record enough volume for Silver
        vm.prank(authorizedCaller);
        registry.recordVolume(user2, 15_000 * 1e18);

        stats = registry.getReferrerStats(user1);
        assertEq(uint256(stats.tier), uint256(IReferralRegistry.ReferralTier.Silver));

        // Record enough for Gold
        vm.prank(authorizedCaller);
        registry.recordVolume(user2, 40_000 * 1e18);

        stats = registry.getReferrerStats(user1);
        assertEq(uint256(stats.tier), uint256(IReferralRegistry.ReferralTier.Gold));

        // Record enough for Diamond
        vm.prank(authorizedCaller);
        registry.recordVolume(user2, 150_000 * 1e18);

        stats = registry.getReferrerStats(user1);
        assertEq(uint256(stats.tier), uint256(IReferralRegistry.ReferralTier.Diamond));
    }

    function test_RecordVolume_NoOpForUserWithoutReferrer() public {
        vm.prank(authorizedCaller);
        registry.recordVolume(user2, 1000 ether);

        // Should not revert and not update anything
        assertEq(registry.totalReferralVolume(), 0);
    }

    function test_RecordVolume_RevertsIfNotAuthorized() public {
        vm.prank(user1);
        vm.expectRevert(ReferralRegistry.NotAuthorized.selector);
        registry.recordVolume(user2, 1000 ether);
    }

    // ============ Earnings Recording Tests ============

    function test_RecordEarnings_Success() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        vm.prank(authorizedCaller);
        registry.recordEarnings(user1, 100 ether);

        IReferralRegistry.ReferrerStats memory stats = registry.getReferrerStats(user1);
        assertEq(stats.totalEarnings, 100 ether);
        assertEq(stats.pendingEarnings, 100 ether);
        assertEq(registry.totalReferralEarnings(), 100 ether);
    }

    function test_RecordEarnings_RevertsOnZeroAddress() public {
        vm.prank(authorizedCaller);
        vm.expectRevert(ReferralRegistry.InvalidAddress.selector);
        registry.recordEarnings(address(0), 100 ether);
    }

    function test_MarkEarningsClaimed_Success() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        vm.startPrank(authorizedCaller);
        registry.recordEarnings(user1, 100 ether);
        registry.markEarningsClaimed(user1, 50 ether);
        vm.stopPrank();

        IReferralRegistry.ReferrerStats memory stats = registry.getReferrerStats(user1);
        assertEq(stats.totalEarnings, 100 ether);
        assertEq(stats.pendingEarnings, 50 ether);
    }

    // ============ View Functions Tests ============

    function test_GetReferrer() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);
        vm.prank(user2);
        registry.useCode(CODE_1);

        assertEq(registry.getReferrer(user2), user1);
        assertEq(registry.getReferrer(user3), address(0));
    }

    function test_GetCodeOwner() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        assertEq(registry.getCodeOwner(CODE_1), user1);
        assertEq(registry.getCodeOwner(CODE_2), address(0));
    }

    function test_GetCode() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        assertEq(registry.getCode(user1), CODE_1);
        assertEq(registry.getCode(user2), bytes32(0));
    }

    function test_IsCodeAvailable() public {
        assertTrue(registry.isCodeAvailable(CODE_1));

        vm.prank(user1);
        registry.registerCode(CODE_1);

        assertFalse(registry.isCodeAvailable(CODE_1));
        assertFalse(registry.isCodeAvailable(bytes32(0)));
    }

    function test_GetReferralDetails() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);
        vm.prank(user2);
        registry.useCode(CODE_1);

        (address referrer, bytes32 code, IReferralRegistry.ReferralTier tier) =
            registry.getReferralDetails(user2);

        assertEq(referrer, user1);
        assertEq(code, CODE_1);
        assertEq(uint256(tier), uint256(IReferralRegistry.ReferralTier.Bronze));
    }

    function test_GetProtocolStats() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);
        vm.prank(user2);
        registry.useCode(CODE_1);

        vm.prank(authorizedCaller);
        registry.recordVolume(user2, 1000 ether);

        vm.prank(authorizedCaller);
        registry.recordEarnings(user1, 50 ether);

        (uint256 codes, uint256 referrals, uint256 volume, uint256 earnings) =
            registry.getProtocolStats();

        assertEq(codes, 1);
        assertEq(referrals, 1);
        assertEq(volume, 1000 ether);
        assertEq(earnings, 50 ether);
    }

    function test_CalculateTier() public view {
        assertEq(
            uint256(registry.calculateTier(0)),
            uint256(IReferralRegistry.ReferralTier.Bronze)
        );
        assertEq(
            uint256(registry.calculateTier(10_000 * 1e18)),
            uint256(IReferralRegistry.ReferralTier.Silver)
        );
        assertEq(
            uint256(registry.calculateTier(50_000 * 1e18)),
            uint256(IReferralRegistry.ReferralTier.Gold)
        );
        assertEq(
            uint256(registry.calculateTier(200_000 * 1e18)),
            uint256(IReferralRegistry.ReferralTier.Diamond)
        );
    }

    // ============ Admin Functions Tests ============

    function test_SetAuthorizedCaller_Success() public {
        address newCaller = makeAddr("newCaller");

        vm.prank(owner);
        registry.setAuthorizedCaller(newCaller, true);

        assertTrue(registry.authorizedCallers(newCaller));

        vm.prank(owner);
        registry.setAuthorizedCaller(newCaller, false);

        assertFalse(registry.authorizedCallers(newCaller));
    }

    function test_SetAuthorizedCaller_RevertsIfNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        registry.setAuthorizedCaller(user2, true);
    }

    function test_SetTierThreshold_Success() public {
        vm.prank(owner);
        registry.setTierThreshold(
            IReferralRegistry.ReferralTier.Silver,
            20_000 * 1e18,
            3000,
            1000
        );

        (uint256 minVol, uint256 share, uint256 discount) = registry.tierThresholds(1);
        assertEq(minVol, 20_000 * 1e18);
        assertEq(share, 3000);
        assertEq(discount, 1000);
    }

    function test_ForceNewWeek_Success() public {
        uint256 initialWeekStart = registry.currentWeekStart();

        vm.warp(block.timestamp + 1 days);
        vm.prank(owner);
        registry.forceNewWeek();

        assertGt(registry.currentWeekStart(), initialWeekStart);
    }

    function test_Pause_StopsRegistration() public {
        vm.prank(owner);
        registry.pause();

        vm.prank(user1);
        vm.expectRevert();
        registry.registerCode(CODE_1);
    }

    function test_Unpause_AllowsRegistration() public {
        vm.startPrank(owner);
        registry.pause();
        registry.unpause();
        vm.stopPrank();

        vm.prank(user1);
        registry.registerCode(CODE_1);

        assertEq(registry.codeToOwner(CODE_1), user1);
    }

    function test_TransferCodeOwnership_Success() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        vm.prank(authorizedCaller);
        registry.recordEarnings(user1, 100 ether);

        vm.prank(owner);
        registry.transferCodeOwnership(CODE_1, user2);

        assertEq(registry.codeToOwner(CODE_1), user2);
        assertEq(registry.ownerToCode(user2), CODE_1);
        assertEq(registry.ownerToCode(user1), bytes32(0));

        // Check data was transferred
        IReferralRegistry.ReferrerStats memory stats = registry.getReferrerStats(user2);
        assertEq(stats.totalEarnings, 100 ether);
    }

    function test_TransferCodeOwnership_RevertsOnNonexistentCode() public {
        vm.prank(owner);
        vm.expectRevert(ReferralRegistry.CodeNotFound.selector);
        registry.transferCodeOwnership(CODE_1, user2);
    }

    function test_TransferCodeOwnership_RevertsIfNewOwnerHasCode() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);
        vm.prank(user2);
        registry.registerCode(CODE_2);

        vm.prank(owner);
        vm.expectRevert(ReferralRegistry.AlreadyHasCode.selector);
        registry.transferCodeOwnership(CODE_1, user2);
    }

    // ============ Multi-Referral Scenario Tests ============

    function test_MultipleReferrals_TrackedCorrectly() public {
        // User1 creates a code
        vm.prank(user1);
        registry.registerCode(CODE_1);

        // Multiple users use the code
        for (uint256 i = 0; i < 5; i++) {
            address user = address(uint160(0x1000 + i));
            vm.prank(user);
            registry.useCode(CODE_1);
        }

        IReferralRegistry.ReferrerStats memory stats = registry.getReferrerStats(user1);
        assertEq(stats.totalReferrals, 5);
        assertEq(stats.activeReferrals, 5);
        assertEq(registry.totalReferrals(), 5);
    }

    function test_VolumeFromMultipleReferees_Aggregated() public {
        vm.prank(user1);
        registry.registerCode(CODE_1);

        // Create referrals
        address referee1 = address(0x2001);
        address referee2 = address(0x2002);
        vm.prank(referee1);
        registry.useCode(CODE_1);
        vm.prank(referee2);
        registry.useCode(CODE_1);

        // Record volume from both
        vm.startPrank(authorizedCaller);
        registry.recordVolume(referee1, 5000 ether);
        registry.recordVolume(referee2, 3000 ether);
        vm.stopPrank();

        IReferralRegistry.ReferrerStats memory stats = registry.getReferrerStats(user1);
        assertEq(stats.totalVolume, 8000 ether);
        assertEq(stats.weeklyVolume, 8000 ether);
    }
}
