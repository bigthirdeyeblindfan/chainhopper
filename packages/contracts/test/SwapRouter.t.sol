// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SwapRouter} from "../src/SwapRouter.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockERC20
 * @notice Simple ERC20 mock for testing
 */
contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

/**
 * @title MockUniswapV2Router
 * @notice Mock router for testing swap functionality
 */
contract MockUniswapV2Router {
    address public immutable WETH;
    uint256 public mockRate = 1e18; // 1:1 rate by default

    constructor(address _weth) {
        WETH = _weth;
    }

    function setMockRate(uint256 rate) external {
        mockRate = rate;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "EXPIRED");
        require(path.length >= 2, "INVALID_PATH");

        uint256 amountOut = (amountIn * mockRate) / 1e18;
        require(amountOut >= amountOutMin, "INSUFFICIENT_OUTPUT");

        // Transfer tokens
        MockERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        MockERC20(path[path.length - 1]).mint(to, amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "EXPIRED");
        require(path.length >= 2, "INVALID_PATH");

        uint256 amountOut = (msg.value * mockRate) / 1e18;
        require(amountOut >= amountOutMin, "INSUFFICIENT_OUTPUT");

        MockERC20(path[path.length - 1]).mint(to, amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = msg.value;
        amounts[path.length - 1] = amountOut;
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "EXPIRED");
        require(path.length >= 2, "INVALID_PATH");

        uint256 amountOut = (amountIn * mockRate) / 1e18;
        require(amountOut >= amountOutMin, "INSUFFICIENT_OUTPUT");

        MockERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        payable(to).transfer(amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
    }

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts) {
        require(path.length >= 2, "INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = (amountIn * mockRate) / 1e18;
    }

    receive() external payable {}
}

/**
 * @title SwapRouter Test Suite
 * @notice Comprehensive tests for the SwapRouter contract
 */
contract SwapRouterTest is Test {
    SwapRouter public swapRouter;
    FeeCollector public feeCollector;
    MockUniswapV2Router public mockRouter;
    MockERC20 public weth;
    MockERC20 public tokenA;
    MockERC20 public tokenB;

    address public treasury = makeAddr("treasury");
    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");

    bytes32 public constant DEX_ID = keccak256("mock-dex");

    function setUp() public {
        // Deploy mock tokens
        weth = new MockERC20("Wrapped ETH", "WETH");
        tokenA = new MockERC20("Token A", "TKNA");
        tokenB = new MockERC20("Token B", "TKNB");

        // Deploy mock router and fund it with ETH
        mockRouter = new MockUniswapV2Router(address(weth));
        vm.deal(address(mockRouter), 1000 ether);

        // Deploy FeeCollector
        vm.prank(owner);
        feeCollector = new FeeCollector(treasury);

        // Deploy SwapRouter
        vm.prank(owner);
        swapRouter = new SwapRouter(address(feeCollector));

        // Register DEX
        vm.prank(owner);
        swapRouter.registerDex(DEX_ID, address(mockRouter), address(weth));

        // Mint tokens to user
        tokenA.mint(user1, 1000 ether);
        tokenB.mint(user1, 1000 ether);

        // Fund user with ETH
        vm.deal(user1, 100 ether);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsFeeCollector() public view {
        assertEq(address(swapRouter.feeCollector()), address(feeCollector));
    }

    function test_Constructor_SetsOwner() public view {
        assertEq(swapRouter.owner(), owner);
    }

    function test_Constructor_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(SwapRouter.InvalidAddress.selector);
        new SwapRouter(address(0));
    }

    // ============ DEX Registration Tests ============

    function test_RegisterDex_Success() public {
        bytes32 newDexId = keccak256("new-dex");
        address newRouter = makeAddr("newRouter");
        address newWeth = makeAddr("newWeth");

        vm.prank(owner);
        swapRouter.registerDex(newDexId, newRouter, newWeth);

        assertEq(swapRouter.dexRouters(newDexId), newRouter);
        assertEq(swapRouter.dexWeth(newDexId), newWeth);
        assertTrue(swapRouter.dexEnabled(newDexId));
    }

    function test_RegisterDex_RevertsIfNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        swapRouter.registerDex(keccak256("test"), makeAddr("router"), makeAddr("weth"));
    }

    function test_RegisterDex_RevertsOnZeroRouter() public {
        vm.prank(owner);
        vm.expectRevert(SwapRouter.InvalidAddress.selector);
        swapRouter.registerDex(keccak256("test"), address(0), makeAddr("weth"));
    }

    function test_RegisterDex_RevertsOnZeroWeth() public {
        vm.prank(owner);
        vm.expectRevert(SwapRouter.InvalidAddress.selector);
        swapRouter.registerDex(keccak256("test"), makeAddr("router"), address(0));
    }

    // ============ DEX Status Tests ============

    function test_SetDexEnabled_Success() public {
        vm.prank(owner);
        swapRouter.setDexEnabled(DEX_ID, false);

        assertFalse(swapRouter.dexEnabled(DEX_ID));

        vm.prank(owner);
        swapRouter.setDexEnabled(DEX_ID, true);

        assertTrue(swapRouter.dexEnabled(DEX_ID));
    }

    function test_SetDexEnabled_RevertsIfInvalidDex() public {
        vm.prank(owner);
        vm.expectRevert(SwapRouter.InvalidDex.selector);
        swapRouter.setDexEnabled(keccak256("nonexistent"), true);
    }

    // ============ Swap Tests ============

    function test_Swap_TokenToToken() public {
        uint256 amountIn = 100 ether;
        uint256 deadline = block.timestamp + 1 hours;

        // Approve tokens
        vm.startPrank(user1);
        tokenA.approve(address(swapRouter), amountIn);

        uint256 amountOut = swapRouter.swap(
            DEX_ID,
            address(tokenA),
            address(tokenB),
            amountIn,
            0,
            deadline
        );
        vm.stopPrank();

        assertEq(amountOut, amountIn); // 1:1 rate
        assertEq(tokenB.balanceOf(user1), 1000 ether + amountOut);
    }

    function test_Swap_ETHToToken() public {
        uint256 amountIn = 1 ether;
        uint256 deadline = block.timestamp + 1 hours;

        vm.prank(user1);
        uint256 amountOut = swapRouter.swap{value: amountIn}(
            DEX_ID,
            address(0),
            address(tokenA),
            amountIn,
            0,
            deadline
        );

        assertEq(amountOut, amountIn);
        assertEq(tokenA.balanceOf(user1), 1000 ether + amountOut);
    }

    function test_Swap_TokenToETH() public {
        uint256 amountIn = 100 ether;
        uint256 deadline = block.timestamp + 1 hours;
        uint256 ethBalanceBefore = user1.balance;

        vm.startPrank(user1);
        tokenA.approve(address(swapRouter), amountIn);

        uint256 amountOut = swapRouter.swap(
            DEX_ID,
            address(tokenA),
            address(0),
            amountIn,
            0,
            deadline
        );
        vm.stopPrank();

        assertEq(amountOut, amountIn);
        assertEq(user1.balance, ethBalanceBefore + amountOut);
    }

    function test_Swap_RevertsOnExpiredDeadline() public {
        vm.prank(user1);
        vm.expectRevert(SwapRouter.DeadlineExpired.selector);
        swapRouter.swap(
            DEX_ID,
            address(tokenA),
            address(tokenB),
            100 ether,
            0,
            block.timestamp - 1
        );
    }

    function test_Swap_RevertsOnDisabledDex() public {
        vm.prank(owner);
        swapRouter.setDexEnabled(DEX_ID, false);

        vm.prank(user1);
        vm.expectRevert(SwapRouter.InvalidDex.selector);
        swapRouter.swap(
            DEX_ID,
            address(tokenA),
            address(tokenB),
            100 ether,
            0,
            block.timestamp + 1 hours
        );
    }

    function test_Swap_RevertsOnZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert(SwapRouter.ZeroAmount.selector);
        swapRouter.swap(
            DEX_ID,
            address(tokenA),
            address(tokenB),
            0,
            0,
            block.timestamp + 1 hours
        );
    }

    function test_Swap_RevertsOnSameToken() public {
        vm.prank(user1);
        vm.expectRevert(SwapRouter.InvalidPath.selector);
        swapRouter.swap(
            DEX_ID,
            address(tokenA),
            address(tokenA),
            100 ether,
            0,
            block.timestamp + 1 hours
        );
    }

    function test_Swap_UpdatesAnalytics() public {
        uint256 amountIn = 100 ether;

        vm.startPrank(user1);
        tokenA.approve(address(swapRouter), amountIn);
        swapRouter.swap(
            DEX_ID,
            address(tokenA),
            address(tokenB),
            amountIn,
            0,
            block.timestamp + 1 hours
        );
        vm.stopPrank();

        assertEq(swapRouter.totalVolumeRouted(), amountIn);
        assertEq(swapRouter.totalSwapsExecuted(), 1);
        assertEq(swapRouter.volumeByDex(DEX_ID), amountIn);
    }

    // ============ Quote Tests ============

    function test_GetQuote() public view {
        uint256 amountIn = 100 ether;

        uint256 amountOut = swapRouter.getQuote(
            DEX_ID,
            address(tokenA),
            address(tokenB),
            amountIn
        );

        assertEq(amountOut, amountIn); // 1:1 rate in mock
    }

    function test_GetQuote_RevertsOnDisabledDex() public {
        vm.prank(owner);
        swapRouter.setDexEnabled(DEX_ID, false);

        vm.expectRevert(SwapRouter.InvalidDex.selector);
        swapRouter.getQuote(DEX_ID, address(tokenA), address(tokenB), 100 ether);
    }

    function test_GetBestQuote() public view {
        uint256 amountIn = 100 ether;

        (bytes32 bestDexId, uint256 bestAmountOut) = swapRouter.getBestQuote(
            address(tokenA),
            address(tokenB),
            amountIn
        );

        assertEq(bestDexId, DEX_ID);
        assertEq(bestAmountOut, amountIn);
    }

    // ============ View Functions Tests ============

    function test_GetRegisteredDexes() public view {
        bytes32[] memory dexes = swapRouter.getRegisteredDexes();

        assertEq(dexes.length, 1);
        assertEq(dexes[0], DEX_ID);
    }

    function test_GetDexInfo() public view {
        (address router, address wethAddr, bool enabled, uint256 volume) = swapRouter.getDexInfo(DEX_ID);

        assertEq(router, address(mockRouter));
        assertEq(wethAddr, address(weth));
        assertTrue(enabled);
        assertEq(volume, 0);
    }

    // ============ Admin Functions Tests ============

    function test_Pause_StopsSwaps() public {
        vm.prank(owner);
        swapRouter.pause();

        vm.prank(user1);
        vm.expectRevert();
        swapRouter.swap(
            DEX_ID,
            address(tokenA),
            address(tokenB),
            100 ether,
            0,
            block.timestamp + 1 hours
        );
    }

    function test_Unpause_AllowsSwaps() public {
        vm.startPrank(owner);
        swapRouter.pause();
        swapRouter.unpause();
        vm.stopPrank();

        vm.startPrank(user1);
        tokenA.approve(address(swapRouter), 100 ether);

        // Should not revert
        swapRouter.swap(
            DEX_ID,
            address(tokenA),
            address(tokenB),
            100 ether,
            0,
            block.timestamp + 1 hours
        );
        vm.stopPrank();
    }

    function test_RescueTokens_ERC20() public {
        // Send tokens to router
        tokenA.mint(address(swapRouter), 100 ether);

        vm.prank(owner);
        swapRouter.rescueTokens(address(tokenA), treasury, 100 ether);

        assertEq(tokenA.balanceOf(treasury), 100 ether);
        assertEq(tokenA.balanceOf(address(swapRouter)), 0);
    }

    function test_RescueTokens_ETH() public {
        // Send ETH to router
        vm.deal(address(swapRouter), 10 ether);

        uint256 treasuryBalanceBefore = treasury.balance;

        vm.prank(owner);
        swapRouter.rescueTokens(address(0), treasury, 10 ether);

        assertEq(treasury.balance, treasuryBalanceBefore + 10 ether);
    }

    function test_RescueTokens_RevertsIfNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        swapRouter.rescueTokens(address(tokenA), user1, 100 ether);
    }

    function test_RescueTokens_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(SwapRouter.InvalidAddress.selector);
        swapRouter.rescueTokens(address(tokenA), address(0), 100 ether);
    }

    // ============ Receive Function Test ============

    function test_ReceiveETH() public {
        vm.deal(user1, 1 ether);

        vm.prank(user1);
        (bool success,) = address(swapRouter).call{value: 1 ether}("");

        assertTrue(success);
        assertEq(address(swapRouter).balance, 1 ether);
    }
}
