// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FeeCollector.sol";
import "../src/SwapRouter.sol";
import "../src/ReferralRegistry.sol";

contract Deploy is Script {
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy FeeCollector first (treasury address will be deployer for now)
        address treasury = vm.addr(deployerPrivateKey);
        FeeCollector feeCollector = new FeeCollector(treasury);
        console.log("FeeCollector deployed at:", address(feeCollector));

        // Deploy SwapRouter with FeeCollector address
        SwapRouter swapRouter = new SwapRouter(address(feeCollector));
        console.log("SwapRouter deployed at:", address(swapRouter));

        // Deploy ReferralRegistry (no constructor args)
        ReferralRegistry referralRegistry = new ReferralRegistry();
        console.log("ReferralRegistry deployed at:", address(referralRegistry));

        // Authorize SwapRouter and FeeCollector in ReferralRegistry
        referralRegistry.setAuthorizedCaller(address(feeCollector), true);
        referralRegistry.setAuthorizedCaller(address(swapRouter), true);
        console.log("Authorized callers set in ReferralRegistry");

        // Register some DEXes in SwapRouter (Uniswap V2 as example)
        // Note: These addresses are for Ethereum mainnet - adjust for testnet
        bytes32 uniswapV2Id = keccak256("uniswap-v2");
        address uniswapV2Router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        address weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

        swapRouter.registerDex(uniswapV2Id, uniswapV2Router, weth);
        console.log("Uniswap V2 registered in SwapRouter");

        vm.stopBroadcast();

        // Log deployment summary
        console.log("=== Deployment Summary ===");
        console.log("FeeCollector:", address(feeCollector));
        console.log("SwapRouter:", address(swapRouter));
        console.log("ReferralRegistry:", address(referralRegistry));
        console.log("Treasury:", treasury);
    }
}