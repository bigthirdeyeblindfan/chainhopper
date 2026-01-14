#!/bin/bash
# ChainHopper Security Audit Script
# Runs Slither and Mythril analysis on all contracts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$(dirname "$SCRIPT_DIR")"
AUDIT_DIR="$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ChainHopper Security Audit Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check dependencies
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        echo "Install with: $2"
        return 1
    fi
    echo -e "${GREEN}✓ $1 found${NC}"
    return 0
}

echo -e "${YELLOW}Checking dependencies...${NC}"
DEPS_OK=true

check_dependency "slither" "pip install slither-analyzer" || DEPS_OK=false
check_dependency "myth" "pip install mythril" || DEPS_OK=false
check_dependency "forge" "curl -L https://foundry.paradigm.xyz | bash" || DEPS_OK=false

if [ "$DEPS_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}Some dependencies are missing. Install them and re-run.${NC}"
    echo -e "${YELLOW}Continuing with available tools...${NC}"
fi

echo ""

# Create output directory
mkdir -p "$AUDIT_DIR"

# Build contracts first
echo -e "${YELLOW}Building contracts...${NC}"
cd "$CONTRACT_DIR"
forge build --force 2>/dev/null || {
    echo -e "${RED}Build failed. Fix compilation errors before auditing.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Contracts to analyze
CONTRACTS=(
    "src/FeeCollector.sol"
    "src/SwapRouter.sol"
    "src/ReferralRegistry.sol"
    "src/PriceOracle.sol"
)

# Run Slither
run_slither() {
    echo -e "${YELLOW}Running Slither analysis...${NC}"

    if command -v slither &> /dev/null; then
        cd "$CONTRACT_DIR"

        # Run with config file
        slither . --config-file slither.config.json 2>&1 | tee "$AUDIT_DIR/slither-output.txt" || true

        echo -e "${GREEN}✓ Slither analysis complete${NC}"
        echo "  Report: $AUDIT_DIR/slither-report.json"
        echo "  SARIF:  $AUDIT_DIR/slither-report.sarif"
    else
        echo -e "${RED}✗ Slither not installed, skipping${NC}"
    fi
    echo ""
}

# Run Mythril
run_mythril() {
    echo -e "${YELLOW}Running Mythril analysis...${NC}"

    if command -v myth &> /dev/null; then
        cd "$CONTRACT_DIR"

        for contract in "${CONTRACTS[@]}"; do
            contract_name=$(basename "$contract" .sol)
            echo -e "  Analyzing ${BLUE}$contract_name${NC}..."

            # Run Mythril with timeout
            timeout 900 myth analyze "$contract" \
                --solc-json mythril.config.yml \
                --solv 0.8.20 \
                -o jsonv2 \
                > "$AUDIT_DIR/mythril-$contract_name.json" 2>&1 || {
                    echo -e "  ${YELLOW}⚠ $contract_name analysis timed out or failed${NC}"
                    continue
                }

            echo -e "  ${GREEN}✓ $contract_name analyzed${NC}"
        done

        echo -e "${GREEN}✓ Mythril analysis complete${NC}"
    else
        echo -e "${RED}✗ Mythril not installed, skipping${NC}"
    fi
    echo ""
}

# Run Forge tests with gas reporting
run_forge_tests() {
    echo -e "${YELLOW}Running Forge tests with coverage...${NC}"

    cd "$CONTRACT_DIR"

    # Run tests
    forge test -vvv 2>&1 | tee "$AUDIT_DIR/test-output.txt" || {
        echo -e "${RED}✗ Some tests failed${NC}"
    }

    # Generate coverage report
    forge coverage --report lcov 2>/dev/null > "$AUDIT_DIR/coverage.lcov" || true

    # Gas snapshot
    forge snapshot 2>/dev/null > "$AUDIT_DIR/gas-snapshot.txt" || true

    echo -e "${GREEN}✓ Tests and coverage complete${NC}"
    echo ""
}

# Generate summary report
generate_summary() {
    echo -e "${YELLOW}Generating summary report...${NC}"

    SUMMARY_FILE="$AUDIT_DIR/AUDIT_SUMMARY.md"

    cat > "$SUMMARY_FILE" << 'EOF'
# ChainHopper Security Audit Summary

## Audit Date
EOF

    echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$SUMMARY_FILE"

    cat >> "$SUMMARY_FILE" << 'EOF'

## Contracts Analyzed

| Contract | LOC | Purpose |
|----------|-----|---------|
| FeeCollector.sol | ~640 | Profit-share fee collection |
| SwapRouter.sol | ~350 | DEX swap routing |
| ReferralRegistry.sol | ~400 | Referral tracking |
| PriceOracle.sol | ~300 | Chainlink/Pyth price feeds |

## Tools Used

- **Slither**: Static analysis
- **Mythril**: Symbolic execution
- **Forge**: Unit tests & coverage

## Reports Generated

- `slither-report.json` - Slither findings (JSON)
- `slither-report.sarif` - Slither findings (SARIF for GitHub)
- `mythril-*.json` - Mythril findings per contract
- `test-output.txt` - Test results
- `coverage.lcov` - Code coverage
- `gas-snapshot.txt` - Gas usage

## Quick Stats

EOF

    # Add Slither stats if available
    if [ -f "$AUDIT_DIR/slither-report.json" ]; then
        echo "### Slither Findings" >> "$SUMMARY_FILE"
        echo '```' >> "$SUMMARY_FILE"
        cat "$AUDIT_DIR/slither-report.json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'results' in data and 'detectors' in data['results']:
        findings = data['results']['detectors']
        high = sum(1 for f in findings if f.get('impact') == 'High')
        med = sum(1 for f in findings if f.get('impact') == 'Medium')
        low = sum(1 for f in findings if f.get('impact') == 'Low')
        info = sum(1 for f in findings if f.get('impact') == 'Informational')
        print(f'High: {high}')
        print(f'Medium: {med}')
        print(f'Low: {low}')
        print(f'Informational: {info}')
    else:
        print('No findings or different format')
except:
    print('Could not parse findings')
" 2>/dev/null >> "$SUMMARY_FILE" || echo "See slither-report.json" >> "$SUMMARY_FILE"
        echo '```' >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
    fi

    cat >> "$SUMMARY_FILE" << 'EOF'

## Next Steps

1. Review all High and Medium findings
2. Create GitHub issues for confirmed vulnerabilities
3. Fix issues in priority order
4. Re-run audit after fixes
5. Consider professional audit before mainnet

## Common Patterns to Check

- [ ] Reentrancy guards on all state-changing external calls
- [ ] Access control on admin functions
- [ ] Input validation (zero addresses, amounts)
- [ ] Integer overflow/underflow (Solidity 0.8+ built-in)
- [ ] Oracle price staleness checks
- [ ] Proper use of SafeERC20
- [ ] Emergency pause functionality
- [ ] Event emissions for state changes

EOF

    echo -e "${GREEN}✓ Summary generated: $SUMMARY_FILE${NC}"
}

# Main execution
main() {
    run_slither
    run_mythril
    run_forge_tests
    generate_summary

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Audit Complete!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Results saved to: $AUDIT_DIR/"
    echo ""
    echo "Review the following files:"
    echo "  - AUDIT_SUMMARY.md (start here)"
    echo "  - slither-report.json"
    echo "  - mythril-*.json"
    echo ""
}

# Run with option handling
case "${1:-all}" in
    slither)
        run_slither
        ;;
    mythril)
        run_mythril
        ;;
    test)
        run_forge_tests
        ;;
    all)
        main
        ;;
    *)
        echo "Usage: $0 [slither|mythril|test|all]"
        exit 1
        ;;
esac
