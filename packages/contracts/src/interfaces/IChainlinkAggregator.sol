// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IChainlinkAggregator
 * @notice Interface for Chainlink price feed aggregators
 * @dev Based on Chainlink's AggregatorV3Interface
 */
interface IChainlinkAggregator {
    /**
     * @notice Returns the number of decimals in the response
     */
    function decimals() external view returns (uint8);

    /**
     * @notice Returns a human-readable description
     */
    function description() external view returns (string memory);

    /**
     * @notice Returns the version number
     */
    function version() external view returns (uint256);

    /**
     * @notice Get data from a specific round
     * @param _roundId The round ID
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt When the round started
     * @return updatedAt When the round was last updated
     * @return answeredInRound The round in which the answer was computed
     */
    function getRoundData(uint80 _roundId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );

    /**
     * @notice Get data from the latest round
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt When the round started
     * @return updatedAt When the round was last updated
     * @return answeredInRound The round in which the answer was computed
     */
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}
