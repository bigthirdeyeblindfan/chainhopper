# Contributing to ChainHopper

Thank you for your interest in contributing to ChainHopper! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Foundry (for smart contracts)
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/chainhopper/chainhopper.git
cd chainhopper

# Install dependencies
pnpm install

# Install contract dependencies
cd packages/contracts && forge install && cd ../..

# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/bot/.env.example apps/bot/.env
cp apps/web/.env.example apps/web/.env

# Start development
pnpm dev
```

See [Developer Guide](docs/DEVELOPER_GUIDE.md) for detailed setup instructions.

## How to Contribute

### Reporting Bugs

1. **Search existing issues** to avoid duplicates
2. **Use the bug report template** when creating a new issue
3. **Include:**
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Relevant logs or screenshots

### Suggesting Features

1. **Search existing issues** to see if it's been suggested
2. **Use the feature request template**
3. **Describe:**
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative solutions considered
   - Any implementation ideas

### Pull Requests

#### Before Starting

1. **Check existing PRs** to avoid duplicate work
2. **Open an issue first** for significant changes to discuss the approach
3. **Fork the repository** and create a feature branch

#### Branch Naming

```
feature/short-description
fix/issue-number-description
docs/what-youre-documenting
refactor/what-youre-refactoring
```

Examples:
- `feature/add-polygon-support`
- `fix/123-quote-expiry-bug`
- `docs/websocket-guide`
- `refactor/swap-router-gas-optimization`

#### Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes** following our coding standards

3. **Write/update tests** for your changes

4. **Run the test suite**:
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```

5. **For smart contracts**, also run:
   ```bash
   cd packages/contracts
   forge test
   forge fmt --check
   make slither
   ```

6. **Commit your changes** with clear messages:
   ```bash
   git commit -m "feat: add polygon chain support"
   ```

7. **Push and create a PR**:
   ```bash
   git push origin feature/your-feature
   ```

#### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add WebSocket price streaming
fix(bot): handle expired quotes gracefully
docs: add SDK documentation
refactor(contracts): optimize gas usage in FeeCollector
test(core): add unit tests for auth middleware
```

#### PR Requirements

- [ ] All tests pass
- [ ] Code follows project style guidelines
- [ ] Documentation updated if needed
- [ ] No new linting warnings
- [ ] PR description explains the changes
- [ ] Linked to relevant issue(s)

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`, avoid `var`
- Use explicit return types for public functions
- Use interfaces for object shapes
- Avoid `any`, use `unknown` when type is truly unknown

```typescript
// Good
export async function getQuote(params: QuoteParams): Promise<Quote> {
  const result = await fetchQuote(params);
  return result;
}

// Avoid
export async function getQuote(params: any) {
  const result = await fetchQuote(params);
  return result;
}
```

### Solidity

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use custom errors instead of require strings
- Use NatSpec comments for public functions
- Keep functions under 50 lines
- Use `SafeERC20` for token transfers

```solidity
// Good
error InvalidAmount();
error Unauthorized();

/// @notice Collect fee from profit
/// @param user The user address
/// @param profit The profit amount
/// @return fee The collected fee
function collectFee(address user, uint256 profit) external returns (uint256 fee) {
    if (profit == 0) revert InvalidAmount();
    // ...
}

// Avoid
function collectFee(address user, uint256 profit) external returns (uint256) {
    require(profit > 0, "Invalid amount");
    // ...
}
```

### Testing

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Test edge cases and error conditions

```typescript
describe('SwapService', () => {
  describe('getQuote', () => {
    it('should return valid quote for supported tokens', async () => {
      // ...
    });

    it('should throw error for unsupported chain', async () => {
      // ...
    });

    it('should handle zero amount gracefully', async () => {
      // ...
    });
  });
});
```

## Project Structure

```
chainhopper/
├── apps/
│   ├── api/          # REST API (Hono)
│   ├── bot/          # Telegram Bot (Grammy)
│   └── web/          # Web Panel (Next.js)
├── packages/
│   ├── adapters/     # Chain adapters
│   ├── contracts/    # Smart contracts (Foundry)
│   ├── core/         # Shared business logic
│   └── types/        # Shared TypeScript types
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Security

### Reporting Vulnerabilities

**Do NOT open public issues for security vulnerabilities.**

Instead, email security@chainhopper.io with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes

We'll respond within 48 hours and work with you on a fix.

### Smart Contract Security

- All contract changes require security review
- Run `make slither` and `make mythril` before submitting
- New contracts need comprehensive test coverage
- Consider gas optimization but not at the expense of security

## Getting Help

- **Discord:** Join our developer channel
- **GitHub Discussions:** For general questions
- **GitHub Issues:** For bugs and feature requests

## Recognition

Contributors are recognized in:
- Release notes
- README contributors section
- Special Discord role for active contributors

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to ChainHopper!
