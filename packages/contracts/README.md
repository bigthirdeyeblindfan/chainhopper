# ChainHopper Smart Contracts

Solidity smart contracts for the ChainHopper multi-chain trading platform.

## Contracts

| Contract | Description |
|----------|-------------|
| `FeeCollector.sol` | Profit-share fee collection with referral rewards |
| `SwapRouter.sol` | Multi-DEX swap routing with fee integration |
| `ReferralRegistry.sol` | On-chain referral code system |
| `PriceOracle.sol` | Chainlink/Pyth price feed aggregator |

## Quick Start

```bash
# Install dependencies
forge install

# Build
forge build

# Test
forge test -vvv

# Deploy (local)
anvil &
forge script script/DeployAll.s.sol:DeployAll --rpc-url http://localhost:8545 --broadcast
```

## Development

### Build

```bash
forge build
```

### Test

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testSwap

# Run with gas report
forge test --gas-report

# Run coverage
forge coverage
```

### Format

```bash
forge fmt
```

### Security Analysis

```bash
# Slither static analysis
make slither

# Full security audit
make audit
```

## Deployment

### Testnet

```bash
# Configure .env
cp .env.example .env
# Edit .env with your values

# Deploy to Sepolia
make deploy-sepolia
```

### Mainnet

```bash
# Dry run first
make deploy-all-dry RPC_URL=$MAINNET_RPC_URL

# Deploy
make deploy-mainnet

# Verify
make verify-fee-collector
make verify-swap-router
make verify-referral-registry
```

## Architecture

```
┌─────────────────┐
│   SwapRouter    │ ← Entry point for swaps
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  FeeCollector   │ │ ReferralRegistry│ │   PriceOracle   │
│  (profit-share) │ │  (user codes)   │ │  (price feeds)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Documentation

Full documentation: [docs/contracts/README.md](../../docs/contracts/README.md)

## License

MIT
