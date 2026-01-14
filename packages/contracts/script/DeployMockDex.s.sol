// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/mocks/MockDexRouter.sol";
import "../src/SwapRouter.sol";

/**
 * @title DeployMockDex
 * @notice Deploys mock DEX contracts for testnet integration testing
 */
contract DeployMockDex is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying Mock DEX for Testing ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy mock WKAIA (wrapped native token)
        console.log("1. Deploying Mock WKAIA...");
        MockERC20 wkaia = new MockERC20("Wrapped KAIA", "WKAIA", 18);
        console.log("   WKAIA:", address(wkaia));

        // 2. Deploy mock test tokens
        console.log("2. Deploying Mock Tokens...");
        MockERC20 usdt = new MockERC20("Mock USDT", "mUSDT", 6);
        MockERC20 usdc = new MockERC20("Mock USDC", "mUSDC", 6);
        console.log("   mUSDT:", address(usdt));
        console.log("   mUSDC:", address(usdc));

        // 3. Deploy MockDexRouter
        console.log("3. Deploying MockDexRouter...");
        MockDexRouter router = new MockDexRouter(address(wkaia));
        console.log("   MockDexRouter:", address(router));

        // 4. Mint test tokens to deployer and router
        console.log("4. Minting test tokens...");
        uint256 mintAmount = 1_000_000 * 10**18; // 1M tokens
        uint256 mintAmountStable = 1_000_000 * 10**6; // 1M USDT/USDC

        wkaia.mint(deployer, mintAmount);
        wkaia.mint(address(router), mintAmount);
        usdt.mint(deployer, mintAmountStable);
        usdt.mint(address(router), mintAmountStable);
        usdc.mint(deployer, mintAmountStable);
        usdc.mint(address(router), mintAmountStable);
        console.log("   Minted 1M of each token to deployer and router");

        vm.stopBroadcast();

        console.log("");
        console.log("=== Mock DEX Deployment Complete ===");
        console.log("");
        console.log("Contracts:");
        console.log("  WKAIA:         ", address(wkaia));
        console.log("  mUSDT:         ", address(usdt));
        console.log("  mUSDC:         ", address(usdc));
        console.log("  MockDexRouter: ", address(router));
        console.log("");
        console.log("Next: Register MockDexRouter on SwapRouter with:");
        console.log("  cast send <SWAP_ROUTER> 'registerDex(bytes32,address,address)'");
        console.log("    <DEX_ID> <MOCK_ROUTER> <WKAIA>");
    }
}
