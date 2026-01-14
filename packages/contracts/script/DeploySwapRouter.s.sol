// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SwapRouter.sol";

/**
 * @title DeploySwapRouter
 * @notice Deploys only the SwapRouter contract
 *
 * Usage:
 *   forge script script/DeploySwapRouter.s.sol --rpc-url $RPC_URL --broadcast
 *
 * Environment variables:
 *   PRIVATE_KEY - Deployer private key
 *   FEE_COLLECTOR_ADDRESS - Address of deployed FeeCollector (required)
 */
contract DeploySwapRouter is Script {
    function run() external returns (SwapRouter swapRouter) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address feeCollector = vm.envAddress("FEE_COLLECTOR_ADDRESS");

        console.log("Deploying SwapRouter...");
        console.log("FeeCollector:", feeCollector);

        vm.startBroadcast(deployerPrivateKey);

        swapRouter = new SwapRouter(feeCollector);

        vm.stopBroadcast();

        console.log("SwapRouter deployed at:", address(swapRouter));
        return swapRouter;
    }
}
