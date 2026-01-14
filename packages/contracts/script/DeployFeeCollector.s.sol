// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FeeCollector.sol";

/**
 * @title DeployFeeCollector
 * @notice Deploys only the FeeCollector contract
 *
 * Usage:
 *   forge script script/DeployFeeCollector.s.sol --rpc-url $RPC_URL --broadcast
 *
 * Environment variables:
 *   PRIVATE_KEY - Deployer private key
 *   TREASURY_ADDRESS - Treasury address for fee collection (required)
 */
contract DeployFeeCollector is Script {
    function run() external returns (FeeCollector feeCollector) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        console.log("Deploying FeeCollector...");
        console.log("Treasury:", treasury);

        vm.startBroadcast(deployerPrivateKey);

        feeCollector = new FeeCollector(treasury);

        vm.stopBroadcast();

        console.log("FeeCollector deployed at:", address(feeCollector));
        return feeCollector;
    }
}
