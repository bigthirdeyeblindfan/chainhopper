# ChainHopper Contracts Makefile
# Usage: make <target> [ARGS="--network sepolia"]

-include .env

.PHONY: all test clean deploy-all deploy-fee-collector deploy-swap-router deploy-referral-registry configure verify

# Default target
all: test

# =============================================================================
# Build & Test
# =============================================================================

build:
	forge build

test:
	forge test -vvv

test-gas:
	forge test --gas-report

coverage:
	forge coverage

clean:
	forge clean

# =============================================================================
# Deploy Commands
# =============================================================================

# Deploy all contracts (ReferralRegistry, FeeCollector, SwapRouter)
deploy-all:
	@echo "Deploying all contracts..."
	forge script script/DeployAll.s.sol:DeployAll \
		--rpc-url $(RPC_URL) \
		--broadcast \
		--verify \
		-vvvv

# Deploy all contracts (dry run / simulation)
deploy-all-dry:
	@echo "Simulating deployment (dry run)..."
	forge script script/DeployAll.s.sol:DeployAll \
		--rpc-url $(RPC_URL) \
		-vvvv

# Deploy only FeeCollector
deploy-fee-collector:
	forge script script/DeployFeeCollector.s.sol:DeployFeeCollector \
		--rpc-url $(RPC_URL) \
		--broadcast \
		--verify \
		-vvvv

# Deploy only SwapRouter
deploy-swap-router:
	forge script script/DeploySwapRouter.s.sol:DeploySwapRouter \
		--rpc-url $(RPC_URL) \
		--broadcast \
		--verify \
		-vvvv

# Deploy only ReferralRegistry
deploy-referral-registry:
	forge script script/DeployReferralRegistry.s.sol:DeployReferralRegistry \
		--rpc-url $(RPC_URL) \
		--broadcast \
		--verify \
		-vvvv

# =============================================================================
# Configuration Commands
# =============================================================================

# Configure contracts (register DEXes)
configure:
	forge script script/ConfigureContracts.s.sol:ConfigureContracts \
		--rpc-url $(RPC_URL) \
		--broadcast \
		-vvvv

# =============================================================================
# Network-Specific Deploy Shortcuts
# =============================================================================

deploy-sepolia:
	@$(MAKE) deploy-all RPC_URL=$(SEPOLIA_RPC_URL)

deploy-mainnet:
	@$(MAKE) deploy-all RPC_URL=$(MAINNET_RPC_URL)

deploy-arbitrum:
	@$(MAKE) deploy-all RPC_URL=$(ARBITRUM_RPC_URL)

deploy-base:
	@$(MAKE) deploy-all RPC_URL=$(BASE_RPC_URL)

deploy-optimism:
	@$(MAKE) deploy-all RPC_URL=$(OPTIMISM_RPC_URL)

deploy-polygon:
	@$(MAKE) deploy-all RPC_URL=$(POLYGON_RPC_URL)

deploy-bsc:
	@$(MAKE) deploy-all RPC_URL=$(BSC_RPC_URL)

deploy-avalanche:
	@$(MAKE) deploy-all RPC_URL=$(AVALANCHE_RPC_URL)

# =============================================================================
# Verification Commands
# =============================================================================

verify-fee-collector:
	forge verify-contract $(FEE_COLLECTOR_ADDRESS) FeeCollector \
		--constructor-args $$(cast abi-encode "constructor(address)" $(TREASURY_ADDRESS)) \
		--chain-id $(CHAIN_ID) \
		--etherscan-api-key $(ETHERSCAN_API_KEY)

verify-swap-router:
	forge verify-contract $(SWAP_ROUTER_ADDRESS) SwapRouter \
		--constructor-args $$(cast abi-encode "constructor(address)" $(FEE_COLLECTOR_ADDRESS)) \
		--chain-id $(CHAIN_ID) \
		--etherscan-api-key $(ETHERSCAN_API_KEY)

verify-referral-registry:
	forge verify-contract $(REFERRAL_REGISTRY_ADDRESS) ReferralRegistry \
		--chain-id $(CHAIN_ID) \
		--etherscan-api-key $(ETHERSCAN_API_KEY)

# =============================================================================
# Utility Commands
# =============================================================================

# Format Solidity files
fmt:
	forge fmt

# Check formatting
fmt-check:
	forge fmt --check

# Generate gas snapshots
snapshot:
	forge snapshot

# Install dependencies
install:
	forge install

# Update dependencies
update:
	forge update

# =============================================================================
# Help
# =============================================================================

help:
	@echo "ChainHopper Contracts - Available Commands"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build          - Compile contracts"
	@echo "  make test           - Run tests"
	@echo "  make test-gas       - Run tests with gas report"
	@echo "  make coverage       - Generate coverage report"
	@echo "  make clean          - Clean build artifacts"
	@echo ""
	@echo "Deploy (requires RPC_URL env var or use network shortcuts):"
	@echo "  make deploy-all     - Deploy all contracts"
	@echo "  make deploy-all-dry - Simulate deployment (dry run)"
	@echo "  make deploy-sepolia - Deploy to Sepolia testnet"
	@echo "  make deploy-mainnet - Deploy to Ethereum mainnet"
	@echo "  make deploy-arbitrum - Deploy to Arbitrum"
	@echo "  make deploy-base    - Deploy to Base"
	@echo ""
	@echo "Configure:"
	@echo "  make configure      - Register DEX routers on SwapRouter"
	@echo ""
	@echo "Verify:"
	@echo "  make verify-fee-collector     - Verify FeeCollector"
	@echo "  make verify-swap-router       - Verify SwapRouter"
	@echo "  make verify-referral-registry - Verify ReferralRegistry"
	@echo ""
	@echo "Utility:"
	@echo "  make fmt            - Format Solidity files"
	@echo "  make snapshot       - Generate gas snapshots"
	@echo "  make install        - Install dependencies"
