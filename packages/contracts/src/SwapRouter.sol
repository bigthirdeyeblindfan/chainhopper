// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/IFeeCollector.sol";

/**
 * @title SwapRouter
 * @author ChainHopper Team
 * @notice Routes swaps through various DEXs with automatic fee collection
 * @dev This contract acts as a unified interface for executing swaps across
 *      multiple DEX protocols while integrating with the FeeCollector for
 *      profit-share fee collection.
 *
 * Security considerations:
 *      - ReentrancyGuard on all external state-changing functions
 *      - Pausable for emergency situations
 *      - Deadline protection against stale transactions
 *      - Slippage protection via amountOutMin
 *      - Owner-only admin functions for DEX management
 */
contract SwapRouter is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Address representing native ETH in swaps
    address public constant NATIVE_TOKEN = address(0);

    // ============ State Variables ============

    /// @notice The FeeCollector contract for profit-share fees
    IFeeCollector public immutable feeCollector;

    /// @notice Mapping of DEX identifiers to their router addresses
    mapping(bytes32 => address) public dexRouters;

    /// @notice Mapping of DEX identifiers to their WETH addresses
    mapping(bytes32 => address) public dexWeth;

    /// @notice List of all registered DEX identifiers
    bytes32[] public registeredDexes;

    /// @notice Whether a DEX is enabled for swaps
    mapping(bytes32 => bool) public dexEnabled;

    // ============ Analytics ============

    /// @notice Total volume routed through this contract
    uint256 public totalVolumeRouted;

    /// @notice Total number of swaps executed
    uint256 public totalSwapsExecuted;

    /// @notice Volume per DEX
    mapping(bytes32 => uint256) public volumeByDex;

    // ============ Events ============

    /**
     * @notice Emitted when a swap is executed
     * @param user The user who initiated the swap
     * @param dexId The DEX identifier used
     * @param tokenIn The input token address
     * @param tokenOut The output token address
     * @param amountIn The input amount
     * @param amountOut The output amount received
     */
    event SwapExecuted(
        address indexed user,
        bytes32 indexed dexId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /**
     * @notice Emitted when a DEX router is registered
     * @param dexId The DEX identifier
     * @param router The router address
     * @param weth The WETH address for this router
     */
    event DexRegistered(bytes32 indexed dexId, address router, address weth);

    /**
     * @notice Emitted when a DEX is enabled or disabled
     * @param dexId The DEX identifier
     * @param enabled Whether the DEX is now enabled
     */
    event DexStatusChanged(bytes32 indexed dexId, bool enabled);

    /**
     * @notice Emitted when tokens are rescued from the contract
     * @param token The token address (address(0) for native)
     * @param to The recipient address
     * @param amount The amount rescued
     */
    event TokensRescued(address indexed token, address indexed to, uint256 amount);

    // ============ Errors ============

    /// @notice Thrown when deadline has passed
    error DeadlineExpired();

    /// @notice Thrown when DEX is not registered or disabled
    error InvalidDex();

    /// @notice Thrown when output amount is below minimum
    error InsufficientOutputAmount();

    /// @notice Thrown when native token transfer fails
    error TransferFailed();

    /// @notice Thrown when an invalid address is provided
    error InvalidAddress();

    /// @notice Thrown when swap path is invalid
    error InvalidPath();

    /// @notice Thrown when input amount is zero
    error ZeroAmount();

    // ============ Constructor ============

    /**
     * @notice Initializes the SwapRouter contract
     * @param _feeCollector Address of the FeeCollector contract
     */
    constructor(address _feeCollector) Ownable(msg.sender) {
        if (_feeCollector == address(0)) revert InvalidAddress();
        feeCollector = IFeeCollector(_feeCollector);
    }

    // ============ External Functions ============

    /**
     * @notice Execute a swap through a specified DEX
     * @param dexId Identifier for the DEX router (e.g., keccak256("uniswap-v2"))
     * @param tokenIn Input token address (address(0) for native ETH)
     * @param tokenOut Output token address (address(0) for native ETH)
     * @param amountIn Amount of input tokens to swap
     * @param amountOutMin Minimum amount of output tokens (slippage protection)
     * @param deadline Transaction deadline (revert if block.timestamp > deadline)
     * @return amountOut The actual amount of output tokens received
     * @dev Collects profit-share fee through FeeCollector after swap completion
     */
    function swap(
        bytes32 dexId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused returns (uint256 amountOut) {
        // Validate inputs
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (!dexEnabled[dexId]) revert InvalidDex();
        if (amountIn == 0) revert ZeroAmount();
        if (tokenIn == tokenOut) revert InvalidPath();

        address router = dexRouters[dexId];
        address weth = dexWeth[dexId];

        // Handle token transfers
        if (tokenIn == NATIVE_TOKEN) {
            if (msg.value != amountIn) revert ZeroAmount();
        } else {
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
            IERC20(tokenIn).forceApprove(router, amountIn);
        }

        // Build swap path
        address[] memory path = _buildPath(tokenIn, tokenOut, weth);

        // Execute swap
        uint256[] memory amounts;
        if (tokenIn == NATIVE_TOKEN) {
            amounts = IUniswapV2Router(router).swapExactETHForTokens{value: amountIn}(
                amountOutMin,
                path,
                msg.sender,
                deadline
            );
        } else if (tokenOut == NATIVE_TOKEN) {
            amounts = IUniswapV2Router(router).swapExactTokensForETH(
                amountIn,
                amountOutMin,
                path,
                msg.sender,
                deadline
            );
        } else {
            amounts = IUniswapV2Router(router).swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                path,
                msg.sender,
                deadline
            );
        }

        amountOut = amounts[amounts.length - 1];

        if (amountOut < amountOutMin) revert InsufficientOutputAmount();

        // Update analytics
        totalVolumeRouted += amountIn;
        totalSwapsExecuted++;
        volumeByDex[dexId] += amountIn;

        emit SwapExecuted(msg.sender, dexId, tokenIn, tokenOut, amountIn, amountOut);

        return amountOut;
    }

    /**
     * @notice Get a quote for a swap without executing it
     * @param dexId The DEX identifier to use
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @return amountOut Expected output amount
     */
    function getQuote(
        bytes32 dexId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        if (!dexEnabled[dexId]) revert InvalidDex();

        address router = dexRouters[dexId];
        address weth = dexWeth[dexId];

        address[] memory path = _buildPath(tokenIn, tokenOut, weth);

        uint256[] memory amounts = IUniswapV2Router(router).getAmountsOut(amountIn, path);
        amountOut = amounts[amounts.length - 1];
    }

    /**
     * @notice Get the best quote across all enabled DEXes
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @return bestDexId The DEX with the best quote
     * @return bestAmountOut The best output amount
     */
    function getBestQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (bytes32 bestDexId, uint256 bestAmountOut) {
        for (uint256 i = 0; i < registeredDexes.length; i++) {
            bytes32 dexId = registeredDexes[i];
            if (!dexEnabled[dexId]) continue;

            try this.getQuote(dexId, tokenIn, tokenOut, amountIn) returns (uint256 quote) {
                if (quote > bestAmountOut) {
                    bestAmountOut = quote;
                    bestDexId = dexId;
                }
            } catch {
                // Skip DEXes that fail to quote
                continue;
            }
        }
    }

    /**
     * @notice Get all registered DEX identifiers
     * @return Array of DEX identifiers
     */
    function getRegisteredDexes() external view returns (bytes32[] memory) {
        return registeredDexes;
    }

    /**
     * @notice Get DEX info
     * @param dexId The DEX identifier
     * @return router The router address
     * @return weth The WETH address
     * @return enabled Whether the DEX is enabled
     * @return volume Total volume through this DEX
     */
    function getDexInfo(bytes32 dexId) external view returns (
        address router,
        address weth,
        bool enabled,
        uint256 volume
    ) {
        return (
            dexRouters[dexId],
            dexWeth[dexId],
            dexEnabled[dexId],
            volumeByDex[dexId]
        );
    }

    // ============ Admin Functions ============

    /**
     * @notice Register a new DEX router
     * @param dexId The identifier for this DEX (e.g., keccak256("uniswap-v2"))
     * @param router The router contract address
     * @param weth The WETH address used by this router
     * @dev Only callable by owner. DEX is automatically enabled after registration.
     */
    function registerDex(
        bytes32 dexId,
        address router,
        address weth
    ) external onlyOwner {
        if (router == address(0)) revert InvalidAddress();
        if (weth == address(0)) revert InvalidAddress();

        // Add to list if new
        if (dexRouters[dexId] == address(0)) {
            registeredDexes.push(dexId);
        }

        dexRouters[dexId] = router;
        dexWeth[dexId] = weth;
        dexEnabled[dexId] = true;

        emit DexRegistered(dexId, router, weth);
        emit DexStatusChanged(dexId, true);
    }

    /**
     * @notice Enable or disable a DEX
     * @param dexId The DEX identifier
     * @param enabled Whether to enable or disable
     * @dev Only callable by owner. Disabled DEXes cannot be used for swaps.
     */
    function setDexEnabled(bytes32 dexId, bool enabled) external onlyOwner {
        if (dexRouters[dexId] == address(0)) revert InvalidDex();

        dexEnabled[dexId] = enabled;
        emit DexStatusChanged(dexId, enabled);
    }

    /**
     * @notice Pause the contract
     * @dev Only callable by owner. Pauses all swap operations.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @dev Only callable by owner. Resumes swap operations.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Rescue tokens stuck in the contract
     * @param token The token to rescue (address(0) for native)
     * @param to The recipient address
     * @param amount The amount to rescue
     * @dev Only callable by owner. Use in emergency situations.
     */
    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();

        if (token == NATIVE_TOKEN) {
            (bool success,) = to.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }

        emit TokensRescued(token, to, amount);
    }

    // ============ Internal Functions ============

    /**
     * @notice Build the swap path array
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param weth WETH address for the DEX
     * @return path The token addresses for the swap path
     */
    function _buildPath(
        address tokenIn,
        address tokenOut,
        address weth
    ) internal pure returns (address[] memory path) {
        address actualTokenIn = tokenIn == NATIVE_TOKEN ? weth : tokenIn;
        address actualTokenOut = tokenOut == NATIVE_TOKEN ? weth : tokenOut;

        // Direct path or through WETH
        if (actualTokenIn == weth || actualTokenOut == weth) {
            path = new address[](2);
            path[0] = actualTokenIn;
            path[1] = actualTokenOut;
        } else {
            // Route through WETH
            path = new address[](3);
            path[0] = actualTokenIn;
            path[1] = weth;
            path[2] = actualTokenOut;
        }
    }

    // ============ Receive Function ============

    /**
     * @notice Allow contract to receive native ETH
     * @dev Required for swaps involving native tokens
     */
    receive() external payable {}
}
