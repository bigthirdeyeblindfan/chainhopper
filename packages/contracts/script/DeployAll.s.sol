// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FeeCollector.sol";
import "../src/SwapRouter.sol";
import "../src/ReferralRegistry.sol";

/**
 * @title DeployAll
 * @notice Deploys all ChainHopper contracts in the correct order
 * @dev Deploy order:
 *      1. ReferralRegistry (no dependencies)
 *      2. FeeCollector (needs treasury)
 *      3. SwapRouter (needs FeeCollector)
 *
 * Usage:
 *   # Dry run (simulation)
 *   forge script script/DeployAll.s.sol --rpc-url $RPC_URL
 *
 *   # Deploy to testnet
 *   forge script script/DeployAll.s.sol --rpc-url $RPC_URL --broadcast --verify
 *
 *   # Deploy to mainnet (with confirmation)
 *   forge script script/DeployAll.s.sol --rpc-url $RPC_URL --broadcast --verify --slow
 *
 * Environment variables:
 *   PRIVATE_KEY - Deployer private key
 *   TREASURY_ADDRESS - Treasury address for fee collection (defaults to deployer)
 *   ETHERSCAN_API_KEY - For contract verification
 */
contract DeployAll is Script {
    // Deployed contract addresses
    ReferralRegistry public referralRegistry;
    FeeCollector public feeCollector;
    SwapRouter public swapRouter;

    function run() external {
        // Get deployer from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Treasury defaults to deployer if not specified
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);

        console.log("=== ChainHopper Contract Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Treasury:", treasury);
        console.log("Chain ID:", block.chainid);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ReferralRegistry (no dependencies)
        console.log("1. Deploying ReferralRegistry...");
        referralRegistry = new ReferralRegistry();
        console.log("   ReferralRegistry deployed at:", address(referralRegistry));

        // 2. Deploy FeeCollector (needs treasury)
        console.log("2. Deploying FeeCollector...");
        feeCollector = new FeeCollector(treasury);
        console.log("   FeeCollector deployed at:", address(feeCollector));

        // 3. Deploy SwapRouter (needs FeeCollector)
        console.log("3. Deploying SwapRouter...");
        swapRouter = new SwapRouter(address(feeCollector));
        console.log("   SwapRouter deployed at:", address(swapRouter));

        // 4. Configure cross-contract permissions
        console.log("4. Configuring permissions...");

        // Authorize SwapRouter to call ReferralRegistry
        referralRegistry.setAuthorizedCaller(address(swapRouter), true);
        console.log("   SwapRouter authorized on ReferralRegistry");

        // Authorize FeeCollector to call ReferralRegistry (for earnings recording)
        referralRegistry.setAuthorizedCaller(address(feeCollector), true);
        console.log("   FeeCollector authorized on ReferralRegistry");

        vm.stopBroadcast();

        // Log deployment summary
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("ReferralRegistry:", address(referralRegistry));
        console.log("FeeCollector:    ", address(feeCollector));
        console.log("SwapRouter:      ", address(swapRouter));
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Run ConfigureContracts.s.sol to register DEX routers");
        console.log("2. Verify contracts on block explorer");
        console.log("3. Transfer ownership if needed");
    }
}
