// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ReferralRegistry.sol";

/**
 * @title DeployReferralRegistry
 * @notice Deploys only the ReferralRegistry contract
 *
 * Usage:
 *   forge script script/DeployReferralRegistry.s.sol --rpc-url $RPC_URL --broadcast
 *
 * Environment variables:
 *   PRIVATE_KEY - Deployer private key
 */
contract DeployReferralRegistry is Script {
    function run() external returns (ReferralRegistry referralRegistry) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("Deploying ReferralRegistry...");

        vm.startBroadcast(deployerPrivateKey);

        referralRegistry = new ReferralRegistry();

        vm.stopBroadcast();

        console.log("ReferralRegistry deployed at:", address(referralRegistry));
        return referralRegistry;
    }
}
