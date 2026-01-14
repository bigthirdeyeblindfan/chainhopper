// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockDexRouter
 * @notice Mock Uniswap V2-style router for testnet DEX integration testing
 * @dev Simulates swaps by minting output tokens (for testing only)
 */
contract MockDexRouter {
    address public WETH;

    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _weth) {
        WETH = _weth;
    }

    /**
     * @notice Simulate swapExactTokensForTokens
     * @dev Returns 98% of input as output (simulating 2% slippage)
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Expired");
        require(path.length >= 2, "Invalid path");

        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];

        // Transfer input tokens from sender
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Calculate output (98% of input value for simulation)
        uint256 amountOut = (amountIn * 98) / 100;
        require(amountOut >= amountOutMin, "Insufficient output");

        // Transfer output tokens to recipient (must have been pre-funded)
        IERC20(tokenOut).transfer(to, amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);

        return amounts;
    }

    /**
     * @notice Simulate swapExactETHForTokens
     */
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Expired");
        require(path.length >= 2, "Invalid path");
        require(path[0] == WETH, "First token must be WETH");

        address tokenOut = path[path.length - 1];
        uint256 amountIn = msg.value;

        // Calculate output
        uint256 amountOut = (amountIn * 98) / 100;
        require(amountOut >= amountOutMin, "Insufficient output");

        // Transfer output tokens
        IERC20(tokenOut).transfer(to, amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;

        emit Swap(msg.sender, WETH, tokenOut, amountIn, amountOut);

        return amounts;
    }

    /**
     * @notice Simulate swapExactTokensForETH
     */
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Expired");
        require(path.length >= 2, "Invalid path");
        require(path[path.length - 1] == WETH, "Last token must be WETH");

        address tokenIn = path[0];

        // Transfer input tokens
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Calculate output
        uint256 amountOut = (amountIn * 98) / 100;
        require(amountOut >= amountOutMin, "Insufficient output");

        // Send ETH to recipient
        (bool success, ) = to.call{value: amountOut}("");
        require(success, "ETH transfer failed");

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;

        emit Swap(msg.sender, tokenIn, WETH, amountIn, amountOut);

        return amounts;
    }

    /**
     * @notice Get amounts out for a swap path
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external pure returns (uint256[] memory amounts) {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        // Simulate 2% slippage per hop
        uint256 currentAmount = amountIn;
        for (uint256 i = 1; i < path.length; i++) {
            currentAmount = (currentAmount * 98) / 100;
            amounts[i] = currentAmount;
        }
        return amounts;
    }

    // Receive ETH
    receive() external payable {}
}

/**
 * @title MockERC20
 * @notice Simple mintable ERC20 for testing
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
