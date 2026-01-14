// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IUniswapV2Router
 * @notice Interface for Uniswap V2 style routers
 * @dev Compatible with most DEXs that follow the Uniswap V2 interface
 */
interface IUniswapV2Router {
    /**
     * @notice Returns the WETH address used by the router
     */
    function WETH() external view returns (address);

    /**
     * @notice Swap exact tokens for tokens
     * @param amountIn The amount of input tokens
     * @param amountOutMin The minimum amount of output tokens
     * @param path The swap path (array of token addresses)
     * @param to The recipient address
     * @param deadline The transaction deadline
     * @return amounts The amounts for each swap in the path
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /**
     * @notice Swap exact ETH for tokens
     * @param amountOutMin The minimum amount of output tokens
     * @param path The swap path (array of token addresses)
     * @param to The recipient address
     * @param deadline The transaction deadline
     * @return amounts The amounts for each swap in the path
     */
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    /**
     * @notice Swap exact tokens for ETH
     * @param amountIn The amount of input tokens
     * @param amountOutMin The minimum amount of output ETH
     * @param path The swap path (array of token addresses)
     * @param to The recipient address
     * @param deadline The transaction deadline
     * @return amounts The amounts for each swap in the path
     */
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /**
     * @notice Get amounts out for a given input amount and path
     * @param amountIn The input amount
     * @param path The swap path
     * @return amounts The output amounts for each step
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}
