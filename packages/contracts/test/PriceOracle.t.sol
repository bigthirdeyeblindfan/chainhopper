// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {IPriceOracle} from "../src/interfaces/IPriceOracle.sol";
import {IChainlinkAggregator} from "../src/interfaces/IChainlinkAggregator.sol";
import {IPyth} from "../src/interfaces/IPyth.sol";

/**
 * @title MockChainlinkAggregator
 * @notice Mock Chainlink price feed for testing
 */
contract MockChainlinkAggregator is IChainlinkAggregator {
    int256 private _price;
    uint256 private _updatedAt;
    uint8 private _decimals;
    string private _description;

    constructor(int256 price_, uint8 decimals_) {
        _price = price_;
        _decimals = decimals_;
        _updatedAt = block.timestamp;
        _description = "Mock Feed";
    }

    function setPrice(int256 price_) external {
        _price = price_;
        _updatedAt = block.timestamp;
    }

    function setUpdatedAt(uint256 updatedAt_) external {
        _updatedAt = updatedAt_;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function description() external view returns (string memory) {
        return _description;
    }

    function version() external pure returns (uint256) {
        return 1;
    }

    function getRoundData(uint80) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, _price, _updatedAt, _updatedAt, 1);
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, _price, _updatedAt, _updatedAt, 1);
    }
}

/**
 * @title MockPyth
 * @notice Mock Pyth contract for testing
 */
contract MockPyth is IPyth {
    mapping(bytes32 => Price) private _prices;

    function setPrice(bytes32 id, int64 price_, int32 expo, uint256 publishTime) external {
        _prices[id] = Price({
            price: price_,
            conf: 100,
            expo: expo,
            publishTime: publishTime
        });
    }

    function getPrice(bytes32 id) external view returns (Price memory price) {
        return _prices[id];
    }

    function getPriceNoOlderThan(bytes32 id, uint256) external view returns (Price memory price) {
        return _prices[id];
    }

    function getEmaPrice(bytes32 id) external view returns (Price memory price) {
        return _prices[id];
    }

    function getEmaPriceNoOlderThan(bytes32 id, uint256) external view returns (Price memory price) {
        return _prices[id];
    }

    function updatePriceFeeds(bytes[] calldata) external payable {}

    function getUpdateFee(bytes[] calldata) external pure returns (uint256 feeAmount) {
        return 0;
    }
}

/**
 * @title MockERC20
 * @notice Mock ERC20 for testing
 */
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }
}

/**
 * @title PriceOracle Test Suite
 * @notice Comprehensive tests for the PriceOracle contract
 */
contract PriceOracleTest is Test {
    PriceOracle public oracle;
    MockChainlinkAggregator public chainlinkFeed;
    MockPyth public pyth;
    MockERC20 public weth;
    MockERC20 public usdc;

    address public owner = makeAddr("owner");
    address public user = makeAddr("user");

    bytes32 public constant PYTH_ETH_ID = keccak256("ETH/USD");
    bytes32 public constant PYTH_USDC_ID = keccak256("USDC/USD");

    // ETH price: $2000 with 8 decimals
    int256 public constant ETH_PRICE = 200000000000; // $2000
    // USDC price: $1 with 8 decimals
    int256 public constant USDC_PRICE = 100000000; // $1

    function setUp() public {
        // Deploy mocks
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc = new MockERC20("USD Coin", "USDC", 6);
        chainlinkFeed = new MockChainlinkAggregator(ETH_PRICE, 8);
        pyth = new MockPyth();

        // Set up Pyth prices
        pyth.setPrice(PYTH_ETH_ID, 200000000000, -8, block.timestamp); // $2000
        pyth.setPrice(PYTH_USDC_ID, 100000000, -8, block.timestamp); // $1

        // Deploy oracle
        vm.prank(owner);
        oracle = new PriceOracle(address(pyth), address(weth));

        // Configure feeds
        vm.startPrank(owner);
        oracle.configureFeed(
            address(weth),
            address(chainlinkFeed),
            PYTH_ETH_ID,
            1 hours,
            true,
            true
        );
        vm.stopPrank();
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsOwner() public view {
        assertEq(oracle.owner(), owner);
    }

    function test_Constructor_SetsPyth() public view {
        assertEq(address(oracle.pyth()), address(pyth));
    }

    function test_Constructor_SetsWrappedNativeToken() public view {
        assertEq(oracle.wrappedNativeToken(), address(weth));
    }

    function test_Constructor_RevertsOnZeroWrappedToken() public {
        vm.prank(owner);
        vm.expectRevert(PriceOracle.InvalidAddress.selector);
        new PriceOracle(address(pyth), address(0));
    }

    // ============ Price Fetching Tests ============

    function test_GetPrice_FromChainlink() public view {
        uint256 price = oracle.getPrice(address(weth));
        assertEq(price, uint256(ETH_PRICE));
    }

    function test_GetPrice_NativeTokenUsesWrapped() public view {
        uint256 price = oracle.getPrice(address(0));
        assertEq(price, uint256(ETH_PRICE));
    }

    function test_GetPriceData_ReturnsValidData() public view {
        IPriceOracle.PriceData memory data = oracle.getPriceData(address(weth));

        assertEq(data.price, uint256(ETH_PRICE));
        assertEq(data.decimals, 8);
        assertTrue(data.isValid);
        assertGt(data.timestamp, 0);
    }

    function test_GetPrice_RevertsOnUnconfiguredToken() public {
        vm.expectRevert(PriceOracle.InvalidPrice.selector);
        oracle.getPrice(address(usdc));
    }

    function test_GetPrice_RevertsOnStalePrice() public {
        // Make price stale
        chainlinkFeed.setUpdatedAt(block.timestamp - 2 hours);

        // Pyth is also stale
        pyth.setPrice(PYTH_ETH_ID, 200000000000, -8, block.timestamp - 2 hours);

        vm.expectRevert(PriceOracle.InvalidPrice.selector);
        oracle.getPrice(address(weth));
    }

    function test_GetPrice_FallsToPythWhenChainlinkStale() public {
        // Make Chainlink stale
        chainlinkFeed.setUpdatedAt(block.timestamp - 2 hours);

        // Pyth is fresh with different price
        pyth.setPrice(PYTH_ETH_ID, 210000000000, -8, block.timestamp); // $2100

        uint256 price = oracle.getPrice(address(weth));
        assertEq(price, 210000000000);
    }

    // ============ Value Calculation Tests ============

    function test_GetValueUSD_CalculatesCorrectly() public view {
        // 1 ETH at $2000 = $2000
        uint256 amount = 1 ether;
        uint256 value = oracle.getValueUSD(address(weth), amount);

        // Expected: 1e18 * 2000e8 / 1e18 = 2000e8
        assertEq(value, 200000000000); // $2000 with 8 decimals
    }

    function test_GetValueUSD_ZeroAmount() public view {
        uint256 value = oracle.getValueUSD(address(weth), 0);
        assertEq(value, 0);
    }

    function test_GetValueUSD_FractionalAmount() public view {
        // 0.5 ETH at $2000 = $1000
        uint256 amount = 0.5 ether;
        uint256 value = oracle.getValueUSD(address(weth), amount);

        assertEq(value, 100000000000); // $1000 with 8 decimals
    }

    // ============ Price Source Tests ============

    function test_GetPriceSource_ReturnsChainlink() public view {
        IPriceOracle.PriceSource source = oracle.getPriceSource(address(weth));
        assertEq(uint256(source), uint256(IPriceOracle.PriceSource.Chainlink));
    }

    function test_GetPriceSource_ReturnsPythWhenChainlinkStale() public {
        chainlinkFeed.setUpdatedAt(block.timestamp - 2 hours);

        IPriceOracle.PriceSource source = oracle.getPriceSource(address(weth));
        assertEq(uint256(source), uint256(IPriceOracle.PriceSource.Pyth));
    }

    function test_HasPriceFeed_ReturnsTrue() public view {
        assertTrue(oracle.hasPriceFeed(address(weth)));
    }

    function test_HasPriceFeed_ReturnsFalseForUnconfigured() public view {
        assertFalse(oracle.hasPriceFeed(address(usdc)));
    }

    // ============ Feed Configuration Tests ============

    function test_ConfigureFeed_Success() public {
        MockChainlinkAggregator usdcFeed = new MockChainlinkAggregator(USDC_PRICE, 8);

        vm.prank(owner);
        oracle.configureFeed(
            address(usdc),
            address(usdcFeed),
            PYTH_USDC_ID,
            1 hours,
            true,
            true
        );

        assertTrue(oracle.hasPriceFeed(address(usdc)));

        uint256 price = oracle.getPrice(address(usdc));
        assertEq(price, uint256(USDC_PRICE));
    }

    function test_ConfigureFeed_RevertsIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.configureFeed(
            address(usdc),
            address(chainlinkFeed),
            PYTH_USDC_ID,
            1 hours,
            true,
            true
        );
    }

    function test_ConfigureFeed_RevertsOnInvalidStaleness() public {
        vm.startPrank(owner);

        // Too low
        vm.expectRevert(PriceOracle.InvalidStaleness.selector);
        oracle.configureFeed(
            address(usdc),
            address(chainlinkFeed),
            PYTH_USDC_ID,
            1 minutes, // Below MIN_STALENESS
            true,
            true
        );

        // Too high
        vm.expectRevert(PriceOracle.InvalidStaleness.selector);
        oracle.configureFeed(
            address(usdc),
            address(chainlinkFeed),
            PYTH_USDC_ID,
            25 hours, // Above MAX_STALENESS
            true,
            true
        );

        vm.stopPrank();
    }

    function test_ConfigureFeed_RevertsIfNoSource() public {
        vm.prank(owner);
        vm.expectRevert(PriceOracle.NoPriceFeed.selector);
        oracle.configureFeed(
            address(usdc),
            address(chainlinkFeed),
            PYTH_USDC_ID,
            1 hours,
            false, // No Chainlink
            false  // No Pyth
        );
    }

    function test_SetFeedStatus_DisablesFeed() public {
        vm.prank(owner);
        oracle.setFeedStatus(address(weth), false);

        vm.expectRevert(PriceOracle.InvalidPrice.selector);
        oracle.getPrice(address(weth));
    }

    function test_SetFeedStatus_ReenablesFeed() public {
        vm.startPrank(owner);
        oracle.setFeedStatus(address(weth), false);
        oracle.setFeedStatus(address(weth), true);
        vm.stopPrank();

        uint256 price = oracle.getPrice(address(weth));
        assertEq(price, uint256(ETH_PRICE));
    }

    // ============ Chainlink Direct Tests ============

    function test_GetChainlinkPrice_Success() public view {
        (uint256 price, uint256 timestamp) = oracle.getChainlinkPrice(address(weth));

        assertEq(price, uint256(ETH_PRICE));
        assertEq(timestamp, block.timestamp);
    }

    function test_GetChainlinkPrice_NormalizesDecimals() public {
        // Create feed with 18 decimals
        MockChainlinkAggregator feed18 = new MockChainlinkAggregator(
            2000 * 1e18, // $2000 with 18 decimals
            18
        );

        vm.prank(owner);
        oracle.configureFeed(
            address(usdc),
            address(feed18),
            bytes32(0),
            1 hours,
            true,
            false
        );

        (uint256 price,) = oracle.getChainlinkPrice(address(usdc));
        assertEq(price, 200000000000); // Normalized to 8 decimals
    }

    function test_GetChainlinkPrice_RevertsOnZeroPrice() public {
        chainlinkFeed.setPrice(0);

        vm.expectRevert(PriceOracle.InvalidPrice.selector);
        oracle.getChainlinkPrice(address(weth));
    }

    function test_GetChainlinkPrice_RevertsOnNegativePrice() public {
        chainlinkFeed.setPrice(-100);

        vm.expectRevert(PriceOracle.InvalidPrice.selector);
        oracle.getChainlinkPrice(address(weth));
    }

    // ============ Pyth Direct Tests ============

    function test_GetPythPrice_Success() public view {
        (uint256 price, uint256 timestamp) = oracle.getPythPrice(address(weth));

        assertEq(price, 200000000000);
        assertEq(timestamp, block.timestamp);
    }

    // ============ Admin Functions Tests ============

    function test_SetPyth_Success() public {
        MockPyth newPyth = new MockPyth();

        vm.prank(owner);
        oracle.setPyth(address(newPyth));

        assertEq(address(oracle.pyth()), address(newPyth));
    }

    function test_SetWrappedNativeToken_Success() public {
        MockERC20 newWeth = new MockERC20("New WETH", "WETH", 18);

        vm.prank(owner);
        oracle.setWrappedNativeToken(address(newWeth));

        assertEq(oracle.wrappedNativeToken(), address(newWeth));
    }

    function test_SetWrappedNativeToken_RevertsOnZero() public {
        vm.prank(owner);
        vm.expectRevert(PriceOracle.InvalidAddress.selector);
        oracle.setWrappedNativeToken(address(0));
    }

    function test_Pause_StopsGetPrice() public {
        vm.prank(owner);
        oracle.pause();

        vm.expectRevert();
        oracle.getPrice(address(weth));
    }

    function test_Unpause_AllowsGetPrice() public {
        vm.startPrank(owner);
        oracle.pause();
        oracle.unpause();
        vm.stopPrank();

        uint256 price = oracle.getPrice(address(weth));
        assertEq(price, uint256(ETH_PRICE));
    }

    // ============ View Functions Tests ============

    function test_GetConfiguredTokens() public {
        vm.prank(owner);
        oracle.configureFeed(
            address(usdc),
            address(new MockChainlinkAggregator(USDC_PRICE, 8)),
            bytes32(0),
            1 hours,
            true,
            false
        );

        address[] memory tokens = oracle.getConfiguredTokens();
        assertEq(tokens.length, 2);
        assertEq(tokens[0], address(weth));
        assertEq(tokens[1], address(usdc));
    }

    function test_GetFeedConfig() public view {
        PriceOracle.FeedConfig memory config = oracle.getFeedConfig(address(weth));

        assertEq(config.chainlinkFeed, address(chainlinkFeed));
        assertEq(config.pythPriceId, PYTH_ETH_ID);
        assertEq(config.maxStaleness, 1 hours);
        assertTrue(config.useChainlink);
        assertTrue(config.usePyth);
        assertTrue(config.isActive);
    }

    // ============ Edge Cases ============

    function test_NativeTokenUsesWrappedConfig() public view {
        // Native token (address(0)) should use WETH config
        IPriceOracle.PriceData memory dataWeth = oracle.getPriceData(address(weth));
        IPriceOracle.PriceData memory dataNative = oracle.getPriceData(address(0));

        assertEq(dataWeth.price, dataNative.price);
    }

    function test_MultipleFeeds_IndependentPrices() public {
        MockChainlinkAggregator usdcFeed = new MockChainlinkAggregator(USDC_PRICE, 8);

        vm.prank(owner);
        oracle.configureFeed(
            address(usdc),
            address(usdcFeed),
            bytes32(0),
            1 hours,
            true,
            false
        );

        uint256 ethPrice = oracle.getPrice(address(weth));
        uint256 usdcPrice = oracle.getPrice(address(usdc));

        assertEq(ethPrice, uint256(ETH_PRICE));
        assertEq(usdcPrice, uint256(USDC_PRICE));
    }
}
