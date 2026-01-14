// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SwapRouter.sol";
import "../src/ReferralRegistry.sol";
import "../src/FeeCollector.sol";

/**
 * @title ConfigureContracts
 * @notice Configures deployed contracts with DEX routers and permissions
 *
 * Usage:
 *   forge script script/ConfigureContracts.s.sol --rpc-url $RPC_URL --broadcast
 *
 * Environment variables:
 *   PRIVATE_KEY - Owner private key
 *   SWAP_ROUTER_ADDRESS - Deployed SwapRouter address
 *   REFERRAL_REGISTRY_ADDRESS - Deployed ReferralRegistry address (optional)
 *   FEE_COLLECTOR_ADDRESS - Deployed FeeCollector address (optional)
 */
contract ConfigureContracts is Script {
    // DEX identifiers
    bytes32 constant UNISWAP_V2 = keccak256("uniswap-v2");
    bytes32 constant UNISWAP_V3 = keccak256("uniswap-v3");
    bytes32 constant SUSHISWAP = keccak256("sushiswap");
    bytes32 constant PANCAKESWAP = keccak256("pancakeswap");
    bytes32 constant QUICKSWAP = keccak256("quickswap");
    bytes32 constant TRADERJOE = keccak256("traderjoe");
    bytes32 constant SPOOKYSWAP = keccak256("spookyswap");
    bytes32 constant CAMELOT = keccak256("camelot");
    bytes32 constant SWAPX = keccak256("swapx");
    bytes32 constant SHADOW = keccak256("shadow");
    bytes32 constant DRAGONSWAP = keccak256("dragonswap");
    bytes32 constant KLAYSWAP = keccak256("klayswap");

    // Common WETH addresses
    address constant WETH_MAINNET = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant WETH_ARBITRUM = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
    address constant WETH_OPTIMISM = 0x4200000000000000000000000000000000000006;
    address constant WETH_BASE = 0x4200000000000000000000000000000000000006;
    address constant WETH_POLYGON = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270; // WMATIC
    address constant WETH_BSC = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c; // WBNB
    address constant WETH_AVALANCHE = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7; // WAVAX
    address constant WETH_SONIC = 0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38; // Wrapped S
    address constant WETH_BERACHAIN = 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8; // WBERA (testnet)
    address constant WETH_KAIA = 0xe4f05A66Ec68B54A58B17c22107b02e0232cC817; // WKAIA

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address swapRouterAddr = vm.envAddress("SWAP_ROUTER_ADDRESS");

        SwapRouter swapRouter = SwapRouter(payable(swapRouterAddr));

        console.log("=== Configuring ChainHopper Contracts ===");
        console.log("SwapRouter:", swapRouterAddr);
        console.log("Chain ID:", block.chainid);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Register DEX routers based on chain
        if (block.chainid == 1) {
            _configureMainnet(swapRouter);
        } else if (block.chainid == 42161) {
            _configureArbitrum(swapRouter);
        } else if (block.chainid == 10) {
            _configureOptimism(swapRouter);
        } else if (block.chainid == 8453) {
            _configureBase(swapRouter);
        } else if (block.chainid == 137) {
            _configurePolygon(swapRouter);
        } else if (block.chainid == 56) {
            _configureBSC(swapRouter);
        } else if (block.chainid == 43114) {
            _configureAvalanche(swapRouter);
        } else if (block.chainid == 11155111) {
            _configureSepolia(swapRouter);
        } else if (block.chainid == 146) {
            _configureSonic(swapRouter);
        } else if (block.chainid == 80084) {
            _configureBerachain(swapRouter);
        } else if (block.chainid == 8217) {
            _configureKaia(swapRouter);
        } else {
            console.log("Unknown chain ID, skipping DEX configuration");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=== Configuration Complete ===");
    }

    function _configureMainnet(SwapRouter swapRouter) internal {
        console.log("Configuring Ethereum Mainnet DEXes...");

        // Uniswap V2
        swapRouter.registerDex(
            UNISWAP_V2,
            0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D, // UniswapV2Router02
            WETH_MAINNET
        );
        console.log("  Registered: Uniswap V2");

        // SushiSwap
        swapRouter.registerDex(
            SUSHISWAP,
            0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F, // SushiSwap Router
            WETH_MAINNET
        );
        console.log("  Registered: SushiSwap");
    }

    function _configureArbitrum(SwapRouter swapRouter) internal {
        console.log("Configuring Arbitrum DEXes...");

        // SushiSwap on Arbitrum
        swapRouter.registerDex(
            SUSHISWAP,
            0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506, // SushiSwap Router
            WETH_ARBITRUM
        );
        console.log("  Registered: SushiSwap");

        // Camelot
        swapRouter.registerDex(
            CAMELOT,
            0xc873fEcbd354f5A56E00E710B90EF4201db2448d, // Camelot Router
            WETH_ARBITRUM
        );
        console.log("  Registered: Camelot");
    }

    function _configureOptimism(SwapRouter swapRouter) internal {
        console.log("Configuring Optimism DEXes...");

        // Velodrome (UniV2 fork)
        swapRouter.registerDex(
            keccak256("velodrome"),
            0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858, // Velodrome Router
            WETH_OPTIMISM
        );
        console.log("  Registered: Velodrome");
    }

    function _configureBase(SwapRouter swapRouter) internal {
        console.log("Configuring Base DEXes...");

        // Aerodrome (Velodrome fork)
        swapRouter.registerDex(
            keccak256("aerodrome"),
            0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43, // Aerodrome Router
            WETH_BASE
        );
        console.log("  Registered: Aerodrome");

        // SushiSwap on Base
        swapRouter.registerDex(
            SUSHISWAP,
            0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891, // SushiSwap Router
            WETH_BASE
        );
        console.log("  Registered: SushiSwap");
    }

    function _configurePolygon(SwapRouter swapRouter) internal {
        console.log("Configuring Polygon DEXes...");

        // QuickSwap
        swapRouter.registerDex(
            QUICKSWAP,
            0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff, // QuickSwap Router
            WETH_POLYGON
        );
        console.log("  Registered: QuickSwap");

        // SushiSwap on Polygon
        swapRouter.registerDex(
            SUSHISWAP,
            0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506, // SushiSwap Router
            WETH_POLYGON
        );
        console.log("  Registered: SushiSwap");
    }

    function _configureBSC(SwapRouter swapRouter) internal {
        console.log("Configuring BSC DEXes...");

        // PancakeSwap
        swapRouter.registerDex(
            PANCAKESWAP,
            0x10ED43C718714eb63d5aA57B78B54704E256024E, // PancakeSwap Router
            WETH_BSC
        );
        console.log("  Registered: PancakeSwap");
    }

    function _configureAvalanche(SwapRouter swapRouter) internal {
        console.log("Configuring Avalanche DEXes...");

        // Trader Joe
        swapRouter.registerDex(
            TRADERJOE,
            0x60aE616a2155Ee3d9A68541Ba4544862310933d4, // Trader Joe Router
            WETH_AVALANCHE
        );
        console.log("  Registered: Trader Joe");

        // SushiSwap on Avalanche
        swapRouter.registerDex(
            SUSHISWAP,
            0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506, // SushiSwap Router
            WETH_AVALANCHE
        );
        console.log("  Registered: SushiSwap");
    }

    function _configureSepolia(SwapRouter swapRouter) internal {
        console.log("Configuring Sepolia Testnet DEXes...");

        // Uniswap V2 on Sepolia (if available)
        // Note: Use testnet-specific addresses
        swapRouter.registerDex(
            UNISWAP_V2,
            0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008, // Uniswap V2 Router (Sepolia)
            0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9  // WETH (Sepolia)
        );
        console.log("  Registered: Uniswap V2 (Testnet)");
    }

    function _configureSonic(SwapRouter swapRouter) internal {
        console.log("Configuring Sonic DEXes...");

        // SwapX (Uniswap V3 fork - primary DEX on Sonic)
        swapRouter.registerDex(
            SWAPX,
            0xE6eb6F694b8c46B3d6c3acAd6acB5D3A3e8A8e9F, // SwapX Router
            WETH_SONIC
        );
        console.log("  Registered: SwapX");

        // Shadow Exchange (Ve(3,3) DEX)
        swapRouter.registerDex(
            SHADOW,
            0x1234567890123456789012345678901234567890, // Shadow Exchange Router (placeholder)
            WETH_SONIC
        );
        console.log("  Registered: Shadow Exchange");
    }

    function _configureBerachain(SwapRouter swapRouter) internal {
        console.log("Configuring Berachain DEXes...");

        // BEX (Berachain Exchange)
        swapRouter.registerDex(
            keccak256("bex"),
            0x0d5862FDbdd12490f9b4De54c236cff63B038074, // BEX Router (testnet)
            WETH_BERACHAIN
        );
        console.log("  Registered: BEX");
    }

    function _configureKaia(SwapRouter swapRouter) internal {
        console.log("Configuring Kaia DEXes...");

        // DragonSwap (primary DEX on Kaia)
        swapRouter.registerDex(
            DRAGONSWAP,
            0x37CE05F6D9c4CD4b86b4d0f8d8b1b00fF5e4F9Af, // DragonSwap Router
            WETH_KAIA
        );
        console.log("  Registered: DragonSwap");

        // KLAYswap
        swapRouter.registerDex(
            KLAYSWAP,
            0xEf71750C100f7918d6Ded239Ff1CF09E81dEA92D, // KLAYswap Router
            WETH_KAIA
        );
        console.log("  Registered: KLAYswap");
    }
}
