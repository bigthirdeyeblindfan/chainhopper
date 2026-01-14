// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/**
 * @title VerifyContracts
 * @notice Helper script to verify deployed contracts on block explorers
 *
 * Usage:
 *   # Verify FeeCollector
 *   forge verify-contract <ADDRESS> FeeCollector \
 *     --constructor-args $(cast abi-encode "constructor(address)" <TREASURY>) \
 *     --chain-id <CHAIN_ID> \
 *     --etherscan-api-key $ETHERSCAN_API_KEY
 *
 *   # Verify SwapRouter
 *   forge verify-contract <ADDRESS> SwapRouter \
 *     --constructor-args $(cast abi-encode "constructor(address)" <FEE_COLLECTOR>) \
 *     --chain-id <CHAIN_ID> \
 *     --etherscan-api-key $ETHERSCAN_API_KEY
 *
 *   # Verify ReferralRegistry (no constructor args)
 *   forge verify-contract <ADDRESS> ReferralRegistry \
 *     --chain-id <CHAIN_ID> \
 *     --etherscan-api-key $ETHERSCAN_API_KEY
 *
 * Block Explorer API Keys (env vars):
 *   ETHERSCAN_API_KEY - Ethereum, Arbitrum, Optimism, Base, Polygon, BSC
 *   SNOWTRACE_API_KEY - Avalanche
 */
contract VerifyContracts is Script {
    function run() external view {
        console.log("=== Contract Verification Commands ===");
        console.log("");
        console.log("Set these environment variables:");
        console.log("  FEE_COLLECTOR_ADDRESS=<deployed address>");
        console.log("  SWAP_ROUTER_ADDRESS=<deployed address>");
        console.log("  REFERRAL_REGISTRY_ADDRESS=<deployed address>");
        console.log("  TREASURY_ADDRESS=<treasury used in deployment>");
        console.log("");
        console.log("Then run:");
        console.log("");
        console.log("# Verify ReferralRegistry");
        console.log("forge verify-contract $REFERRAL_REGISTRY_ADDRESS ReferralRegistry --chain-id <CHAIN_ID>");
        console.log("");
        console.log("# Verify FeeCollector");
        console.log('forge verify-contract $FEE_COLLECTOR_ADDRESS FeeCollector --constructor-args $(cast abi-encode "constructor(address)" $TREASURY_ADDRESS) --chain-id <CHAIN_ID>');
        console.log("");
        console.log("# Verify SwapRouter");
        console.log('forge verify-contract $SWAP_ROUTER_ADDRESS SwapRouter --constructor-args $(cast abi-encode "constructor(address)" $FEE_COLLECTOR_ADDRESS) --chain-id <CHAIN_ID>');
    }
}
