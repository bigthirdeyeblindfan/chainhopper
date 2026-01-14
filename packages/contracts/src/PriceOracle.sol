// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./interfaces/IPriceOracle.sol";
import "./interfaces/IChainlinkAggregator.sol";
import "./interfaces/IPyth.sol";

/**
 * @title PriceOracle
 * @author ChainHopper Team
 * @notice Multi-source price oracle supporting Chainlink and Pyth
 * @dev Provides reliable price data for the trading system with:
 *      - Primary: Chainlink price feeds
 *      - Secondary: Pyth Network feeds
 *      - Staleness checks to ensure data freshness
 *      - Fallback mechanisms for reliability
 *
 * Security considerations:
 *      - Uses Chainlink/Pyth for prices, NOT DEX spot (oracle manipulation resistant)
 *      - Staleness validation to prevent stale price attacks
 *      - Pausable for emergency situations
 *      - Owner-only configuration functions
 */
contract PriceOracle is IPriceOracle, Ownable, Pausable {
    // ============ Constants ============

    /// @notice Standard price decimals (8, matching Chainlink)
    uint8 public constant PRICE_DECIMALS = 8;

    /// @notice Default maximum staleness for price data (1 hour)
    uint256 public constant DEFAULT_MAX_STALENESS = 1 hours;

    /// @notice Minimum staleness threshold (5 minutes)
    uint256 public constant MIN_STALENESS = 5 minutes;

    /// @notice Maximum staleness threshold (24 hours)
    uint256 public constant MAX_STALENESS = 24 hours;

    // ============ Structs ============

    /// @notice Configuration for a token's price feed
    struct FeedConfig {
        address chainlinkFeed;      // Chainlink aggregator address
        bytes32 pythPriceId;        // Pyth price feed ID
        uint256 maxStaleness;       // Maximum age for valid price
        uint8 tokenDecimals;        // Token decimals for value calculations
        bool useChainlink;          // Whether to use Chainlink as primary
        bool usePyth;               // Whether to use Pyth as fallback
        bool isActive;              // Whether this feed is active
    }

    // ============ State Variables ============

    /// @notice Pyth contract address
    IPyth public pyth;

    /// @notice Feed configurations per token
    mapping(address => FeedConfig) public feedConfigs;

    /// @notice List of configured tokens
    address[] public configuredTokens;

    /// @notice Native token symbol for this chain (e.g., "ETH", "MATIC")
    address public constant NATIVE_TOKEN = address(0);

    /// @notice Wrapped native token address
    address public wrappedNativeToken;

    // ============ Events ============

    /**
     * @notice Emitted when a price feed is configured
     * @param token The token address
     * @param chainlinkFeed The Chainlink feed address
     * @param pythPriceId The Pyth price ID
     */
    event FeedConfigured(
        address indexed token,
        address chainlinkFeed,
        bytes32 pythPriceId
    );

    /**
     * @notice Emitted when a feed is enabled or disabled
     * @param token The token address
     * @param isActive Whether the feed is now active
     */
    event FeedStatusChanged(address indexed token, bool isActive);

    /**
     * @notice Emitted when Pyth contract is updated
     * @param oldPyth The old Pyth address
     * @param newPyth The new Pyth address
     */
    event PythUpdated(address indexed oldPyth, address indexed newPyth);

    /**
     * @notice Emitted when wrapped native token is set
     * @param token The wrapped native token address
     */
    event WrappedNativeTokenSet(address indexed token);

    // ============ Errors ============

    /// @notice Thrown when no valid price feed exists
    error NoPriceFeed();

    /// @notice Thrown when price is stale
    error StalePrice();

    /// @notice Thrown when price is invalid (zero or negative)
    error InvalidPrice();

    /// @notice Thrown when address is invalid
    error InvalidAddress();

    /// @notice Thrown when staleness threshold is invalid
    error InvalidStaleness();

    /// @notice Thrown when feed is not active
    error FeedNotActive();

    // ============ Constructor ============

    /**
     * @notice Initializes the PriceOracle contract
     * @param _pyth Address of the Pyth contract
     * @param _wrappedNativeToken Address of wrapped native token (e.g., WETH)
     */
    constructor(address _pyth, address _wrappedNativeToken) Ownable(msg.sender) {
        if (_wrappedNativeToken == address(0)) revert InvalidAddress();

        pyth = IPyth(_pyth);
        wrappedNativeToken = _wrappedNativeToken;
    }

    // ============ External View Functions ============

    /**
     * @notice Get the USD price of a token
     * @param token The token address (address(0) for native)
     * @return price The price in USD (8 decimals)
     */
    function getPrice(address token) external view whenNotPaused returns (uint256 price) {
        PriceData memory data = _getPriceData(token);
        if (!data.isValid) revert InvalidPrice();
        return data.price;
    }

    /**
     * @notice Get detailed price data for a token
     * @param token The token address
     * @return data The price data struct
     */
    function getPriceData(address token) external view whenNotPaused returns (PriceData memory data) {
        return _getPriceData(token);
    }

    /**
     * @notice Get the USD value of a token amount
     * @param token The token address
     * @param amount The token amount (in token's native decimals)
     * @return value The USD value (8 decimals)
     */
    function getValueUSD(
        address token,
        uint256 amount
    ) external view whenNotPaused returns (uint256 value) {
        if (amount == 0) return 0;

        PriceData memory data = _getPriceData(token);
        if (!data.isValid) revert InvalidPrice();

        // Get token decimals
        uint8 tokenDecimals = _getTokenDecimals(token);

        // Calculate value: (amount * price) / 10^tokenDecimals
        // Result has PRICE_DECIMALS (8)
        value = (amount * data.price) / (10 ** tokenDecimals);
    }

    /**
     * @notice Check if a price feed exists and is valid for a token
     * @param token The token address
     * @return exists Whether a valid price feed exists
     */
    function hasPriceFeed(address token) external view returns (bool exists) {
        address effectiveToken = _getEffectiveToken(token);
        FeedConfig memory config = feedConfigs[effectiveToken];
        return config.isActive && (config.chainlinkFeed != address(0) || config.pythPriceId != bytes32(0));
    }

    /**
     * @notice Get the price source being used for a token
     * @param token The token address
     * @return source The price source type
     */
    function getPriceSource(address token) external view returns (PriceSource source) {
        address effectiveToken = _getEffectiveToken(token);
        FeedConfig memory config = feedConfigs[effectiveToken];

        if (!config.isActive) revert FeedNotActive();

        // Try Chainlink first if configured
        if (config.useChainlink && config.chainlinkFeed != address(0)) {
            try this.getChainlinkPrice(effectiveToken) returns (uint256 price, uint256 timestamp) {
                if (price > 0 && block.timestamp - timestamp <= config.maxStaleness) {
                    return PriceSource.Chainlink;
                }
            } catch {}
        }

        // Try Pyth
        if (config.usePyth && config.pythPriceId != bytes32(0)) {
            return PriceSource.Pyth;
        }

        return PriceSource.Fallback;
    }

    /**
     * @notice Get price from Chainlink feed
     * @param token The token address
     * @return price The price (8 decimals)
     * @return timestamp The price timestamp
     */
    function getChainlinkPrice(address token) external view returns (uint256 price, uint256 timestamp) {
        address effectiveToken = _getEffectiveToken(token);
        FeedConfig memory config = feedConfigs[effectiveToken];

        if (config.chainlinkFeed == address(0)) revert NoPriceFeed();

        IChainlinkAggregator feed = IChainlinkAggregator(config.chainlinkFeed);
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = feed.latestRoundData();

        if (answer <= 0) revert InvalidPrice();

        // Normalize to 8 decimals
        uint8 feedDecimals = feed.decimals();
        if (feedDecimals < PRICE_DECIMALS) {
            price = uint256(answer) * (10 ** (PRICE_DECIMALS - feedDecimals));
        } else if (feedDecimals > PRICE_DECIMALS) {
            price = uint256(answer) / (10 ** (feedDecimals - PRICE_DECIMALS));
        } else {
            price = uint256(answer);
        }

        timestamp = updatedAt;
    }

    /**
     * @notice Get price from Pyth feed
     * @param token The token address
     * @return price The price (8 decimals)
     * @return timestamp The price timestamp
     */
    function getPythPrice(address token) external view returns (uint256 price, uint256 timestamp) {
        address effectiveToken = _getEffectiveToken(token);
        FeedConfig memory config = feedConfigs[effectiveToken];

        if (config.pythPriceId == bytes32(0)) revert NoPriceFeed();
        if (address(pyth) == address(0)) revert NoPriceFeed();

        IPyth.Price memory pythPrice = pyth.getPriceNoOlderThan(
            config.pythPriceId,
            config.maxStaleness
        );

        if (pythPrice.price <= 0) revert InvalidPrice();

        // Convert Pyth price to 8 decimals
        // Pyth uses expo (negative exponent), e.g., price=12345, expo=-2 means 123.45
        int256 adjustedPrice = int256(pythPrice.price);
        int32 targetExpo = -int32(int8(PRICE_DECIMALS)); // -8 for 8 decimals
        int32 expoDiff = pythPrice.expo - targetExpo;

        if (expoDiff > 0) {
            price = uint256(adjustedPrice) * (10 ** uint32(expoDiff));
        } else if (expoDiff < 0) {
            price = uint256(adjustedPrice) / (10 ** uint32(-expoDiff));
        } else {
            price = uint256(adjustedPrice);
        }

        timestamp = pythPrice.publishTime;
    }

    /**
     * @notice Get list of all configured tokens
     * @return tokens Array of configured token addresses
     */
    function getConfiguredTokens() external view returns (address[] memory tokens) {
        return configuredTokens;
    }

    /**
     * @notice Get feed configuration for a token
     * @param token The token address
     * @return config The feed configuration
     */
    function getFeedConfig(address token) external view returns (FeedConfig memory config) {
        return feedConfigs[_getEffectiveToken(token)];
    }

    // ============ Admin Functions ============

    /**
     * @notice Configure a price feed for a token
     * @param token The token address
     * @param chainlinkFeed The Chainlink aggregator address
     * @param pythPriceId The Pyth price feed ID
     * @param maxStaleness Maximum staleness in seconds
     * @param useChainlink Whether to use Chainlink
     * @param usePyth Whether to use Pyth
     */
    function configureFeed(
        address token,
        address chainlinkFeed,
        bytes32 pythPriceId,
        uint256 maxStaleness,
        bool useChainlink,
        bool usePyth
    ) external onlyOwner {
        if (maxStaleness < MIN_STALENESS || maxStaleness > MAX_STALENESS) {
            revert InvalidStaleness();
        }

        // At least one source must be configured
        if (!useChainlink && !usePyth) revert NoPriceFeed();
        if (useChainlink && chainlinkFeed == address(0)) revert InvalidAddress();
        if (usePyth && pythPriceId == bytes32(0)) revert InvalidAddress();

        // Add to list if new
        if (!feedConfigs[token].isActive && feedConfigs[token].chainlinkFeed == address(0)) {
            configuredTokens.push(token);
        }

        // Get token decimals
        uint8 tokenDecimals = _getTokenDecimals(token);

        feedConfigs[token] = FeedConfig({
            chainlinkFeed: chainlinkFeed,
            pythPriceId: pythPriceId,
            maxStaleness: maxStaleness,
            tokenDecimals: tokenDecimals,
            useChainlink: useChainlink,
            usePyth: usePyth,
            isActive: true
        });

        emit FeedConfigured(token, chainlinkFeed, pythPriceId);
    }

    /**
     * @notice Enable or disable a feed
     * @param token The token address
     * @param isActive Whether the feed should be active
     */
    function setFeedStatus(address token, bool isActive) external onlyOwner {
        feedConfigs[token].isActive = isActive;
        emit FeedStatusChanged(token, isActive);
    }

    /**
     * @notice Update the Pyth contract address
     * @param _pyth The new Pyth address
     */
    function setPyth(address _pyth) external onlyOwner {
        address oldPyth = address(pyth);
        pyth = IPyth(_pyth);
        emit PythUpdated(oldPyth, _pyth);
    }

    /**
     * @notice Set the wrapped native token address
     * @param _wrappedNativeToken The wrapped native token address
     */
    function setWrappedNativeToken(address _wrappedNativeToken) external onlyOwner {
        if (_wrappedNativeToken == address(0)) revert InvalidAddress();
        wrappedNativeToken = _wrappedNativeToken;
        emit WrappedNativeTokenSet(_wrappedNativeToken);
    }

    /**
     * @notice Pause the oracle
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the oracle
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Internal Functions ============

    /**
     * @notice Get the effective token address (handle native token)
     * @param token The input token address
     * @return The effective token address
     */
    function _getEffectiveToken(address token) internal view returns (address) {
        return token == NATIVE_TOKEN ? wrappedNativeToken : token;
    }

    /**
     * @notice Get token decimals
     * @param token The token address
     * @return decimals The token decimals
     */
    function _getTokenDecimals(address token) internal view returns (uint8) {
        if (token == NATIVE_TOKEN) {
            return 18; // Native tokens are 18 decimals
        }
        try IERC20Metadata(token).decimals() returns (uint8 dec) {
            return dec;
        } catch {
            return 18; // Default to 18
        }
    }

    /**
     * @notice Get price data from the best available source
     * @param token The token address
     * @return data The price data
     */
    function _getPriceData(address token) internal view returns (PriceData memory data) {
        address effectiveToken = _getEffectiveToken(token);
        FeedConfig memory config = feedConfigs[effectiveToken];

        if (!config.isActive) {
            return PriceData({
                price: 0,
                timestamp: 0,
                decimals: PRICE_DECIMALS,
                isValid: false
            });
        }

        // Try Chainlink first
        if (config.useChainlink && config.chainlinkFeed != address(0)) {
            try this.getChainlinkPrice(effectiveToken) returns (uint256 price, uint256 timestamp) {
                if (price > 0 && block.timestamp - timestamp <= config.maxStaleness) {
                    return PriceData({
                        price: price,
                        timestamp: timestamp,
                        decimals: PRICE_DECIMALS,
                        isValid: true
                    });
                }
            } catch {}
        }

        // Try Pyth as fallback
        if (config.usePyth && config.pythPriceId != bytes32(0) && address(pyth) != address(0)) {
            try this.getPythPrice(effectiveToken) returns (uint256 price, uint256 timestamp) {
                if (price > 0 && block.timestamp - timestamp <= config.maxStaleness) {
                    return PriceData({
                        price: price,
                        timestamp: timestamp,
                        decimals: PRICE_DECIMALS,
                        isValid: true
                    });
                }
            } catch {}
        }

        // No valid price found
        return PriceData({
            price: 0,
            timestamp: 0,
            decimals: PRICE_DECIMALS,
            isValid: false
        });
    }
}
