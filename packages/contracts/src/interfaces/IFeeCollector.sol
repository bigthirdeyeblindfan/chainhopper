// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFeeCollector
 * @notice Interface for the FeeCollector contract
 * @dev Used by SwapRouter to collect profit-share fees
 */
interface IFeeCollector {
    /**
     * @notice Collect profit-share fee from a profitable trade
     * @param user The user who made the profit
     * @param token The token in which profit was made (address(0) for native)
     * @param profit The profit amount
     * @return fee The fee collected
     * @return netProfit The profit after fee deduction
     */
    function collectProfitFee(
        address user,
        address token,
        uint256 profit
    ) external payable returns (uint256 fee, uint256 netProfit);

    /**
     * @notice Calculate the fee for a given profit amount
     * @param user The user to calculate fee for
     * @param profit The profit amount
     * @return fee The calculated fee
     * @return netProfit The profit after fee
     * @return referralReward The reward that would go to referrer
     */
    function calculateProfitFee(
        address user,
        uint256 profit
    ) external view returns (uint256 fee, uint256 netProfit, uint256 referralReward);
}
