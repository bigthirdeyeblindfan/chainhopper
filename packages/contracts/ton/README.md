# TON Contracts

This directory contains TON blockchain smart contracts for ChainHopper's fee collection system.

## Contracts

### FeeCollector

The FeeCollector contract implements the profit-share fee model:

| Tier | Profit Share | Requirement |
|------|--------------|-------------|
| Free | 15% | None |
| Holder | 10% | 1,000 $HOPPER |
| Staker | 5% | 10,000 veHOPPER |
| Enterprise | 2-5% | Custom deal |

### Referral System

| Tier | Weekly Volume | Referrer Share | Referee Discount |
|------|---------------|----------------|------------------|
| Bronze | <$10K | 20% of fee | 5% off |
| Silver | $10K-$50K | 25% of fee | 7.5% off |
| Gold | $50K-$200K | 30% of fee | 10% off |
| Diamond | >$200K | 35% of fee | 10% off |

## Files

- `fee_collector.fc` - FunC implementation (low-level)
- `FeeCollector.tact` - Tact implementation (recommended for development)

## Compilation

### FunC

```bash
# Install func compiler
npm install -g @ton-community/func-js

# Compile
func -o fee_collector.fif -SPA stdlib.fc fee_collector.fc

# Create code cell
fift -s fee_collector.fif
```

### Tact (Recommended)

```bash
# Install tact compiler
npm install -g @tact-lang/compiler

# Compile
tact compile FeeCollector.tact

# Output will be in build/ directory
```

## Deployment

### Using Blueprint (Recommended)

```bash
# Initialize blueprint project
npm create ton@latest

# Copy contracts
cp FeeCollector.tact contracts/

# Deploy to testnet
npx blueprint run --testnet

# Deploy to mainnet
npx blueprint run --mainnet
```

### Manual Deployment

```typescript
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

async function deploy() {
    const client = new TonClient({
        endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    });

    const mnemonic = process.env.MNEMONIC!.split(" ");
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const wallet = WalletContractV4.create({
        publicKey: keyPair.publicKey,
        workchain: 0,
    });

    const treasury = Address.parse(process.env.TREASURY_ADDRESS!);

    // Deploy FeeCollector
    const feeCollector = FeeCollector.createFromConfig(
        { treasury },
        code
    );

    await client.sendExternalMessage(wallet, {
        secretKey: keyPair.secretKey,
        messages: [
            internal({
                to: feeCollector.address,
                value: toNano("0.5"),
                init: feeCollector.init,
            }),
        ],
    });

    console.log("Deployed to:", feeCollector.address.toString());
}
```

## Testing

```bash
# Install dependencies
npm install @ton/sandbox @ton/test-utils

# Run tests
npx jest
```

Example test:

```typescript
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { FeeCollector } from "../wrappers/FeeCollector";
import { toNano } from "@ton/core";

describe("FeeCollector", () => {
    let blockchain: Blockchain;
    let feeCollector: SandboxContract<FeeCollector>;
    let treasury: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        treasury = await blockchain.treasury("treasury");

        feeCollector = blockchain.openContract(
            FeeCollector.createFromConfig({ treasury: treasury.address })
        );
    });

    it("should collect fees correctly", async () => {
        const user = await blockchain.treasury("user");

        const result = await feeCollector.sendCollectFee(user.getSender(), {
            value: toNano("1"),
            profitAmount: toNano("100"),
            userTier: 0, // Free tier
        });

        expect(result.transactions).toHaveLength(2);

        const stats = await feeCollector.getStats();
        expect(stats.totalVolume).toBe(toNano("100"));
        expect(stats.totalFees).toBe(toNano("15")); // 15%
    });
});
```

## Security Considerations

1. **Access Control** - Owner-only functions for admin operations
2. **Reentrancy** - TON's message-passing model prevents reentrancy
3. **Integer Overflow** - FunC/Tact handle large integers natively
4. **Pausable** - Contract can be paused in emergencies

## Gas Costs

| Operation | Approximate Cost |
|-----------|------------------|
| Collect Fee | ~0.02 TON |
| Register Referrer | ~0.01 TON |
| Claim Referral | ~0.015 TON |
| Withdraw Fees | ~0.01 TON |

## Contract Addresses

| Network | Address |
|---------|---------|
| Testnet | TBD |
| Mainnet | TBD |

## License

MIT
