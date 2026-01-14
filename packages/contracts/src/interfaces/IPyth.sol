// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPyth
 * @notice Interface for Pyth Network price feeds
 * @dev Based on Pyth's IPyth interface
 */
interface IPyth {
    /// @notice Price structure from Pyth
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    /**
     * @notice Get the current price for a price feed ID
     * @param id The price feed ID
     * @return price The current price
     */
    function getPrice(bytes32 id) external view returns (Price memory price);

    /**
     * @notice Get the price if it's no older than age seconds
     * @param id The price feed ID
     * @param age Maximum acceptable age in seconds
     * @return price The price if valid
     */
    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (Price memory price);

    /**
     * @notice Get the EMA (exponentially-weighted moving average) price
     * @param id The price feed ID
     * @return price The EMA price
     */
    function getEmaPrice(bytes32 id) external view returns (Price memory price);

    /**
     * @notice Get the EMA price if it's no older than age seconds
     * @param id The price feed ID
     * @param age Maximum acceptable age in seconds
     * @return price The EMA price if valid
     */
    function getEmaPriceNoOlderThan(bytes32 id, uint256 age) external view returns (Price memory price);

    /**
     * @notice Update price feeds with new data
     * @param updateData The price update data
     */
    function updatePriceFeeds(bytes[] calldata updateData) external payable;

    /**
     * @notice Get the fee required to update price feeds
     * @param updateData The price update data
     * @return feeAmount The fee required
     */
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount);
}
