// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPriceOracle
 * @notice Interface for the PriceOracle contract
 * @dev Provides price data from multiple sources (Chainlink, Pyth)
 */
interface IPriceOracle {
    /// @notice Price data structure
    struct PriceData {
        uint256 price;          // Price in USD with 8 decimals
        uint256 timestamp;      // When the price was last updated
        uint8 decimals;         // Price decimals (usually 8)
        bool isValid;           // Whether the price is valid/not stale
    }

    /// @notice Price source types
    enum PriceSource {
        Chainlink,
        Pyth,
        Fallback
    }

    /**
     * @notice Get the USD price of a token
     * @param token The token address
     * @return price The price in USD (8 decimals)
     */
    function getPrice(address token) external view returns (uint256 price);

    /**
     * @notice Get detailed price data for a token
     * @param token The token address
     * @return data The price data struct
     */
    function getPriceData(address token) external view returns (PriceData memory data);

    /**
     * @notice Get the USD value of a token amount
     * @param token The token address
     * @param amount The token amount
     * @return value The USD value (8 decimals)
     */
    function getValueUSD(address token, uint256 amount) external view returns (uint256 value);

    /**
     * @notice Check if a price feed exists and is valid for a token
     * @param token The token address
     * @return exists Whether a valid price feed exists
     */
    function hasPriceFeed(address token) external view returns (bool exists);

    /**
     * @notice Get the price source being used for a token
     * @param token The token address
     * @return source The price source type
     */
    function getPriceSource(address token) external view returns (PriceSource source);
}
