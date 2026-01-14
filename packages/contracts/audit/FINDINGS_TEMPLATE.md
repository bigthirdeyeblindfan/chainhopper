# Security Finding Report

## Finding ID: [CHAIN-XXX]

### Severity
- [ ] Critical
- [ ] High
- [ ] Medium
- [ ] Low
- [ ] Informational

### Category
- [ ] Reentrancy
- [ ] Access Control
- [ ] Arithmetic
- [ ] Oracle Manipulation
- [ ] Front-running
- [ ] Denial of Service
- [ ] Logic Error
- [ ] Gas Optimization
- [ ] Best Practice

### Status
- [ ] Open
- [ ] Confirmed
- [ ] Fixed
- [ ] Won't Fix
- [ ] Acknowledged

---

## Summary

_Brief description of the vulnerability_

## Affected Contract(s)

| Contract | Function | Line |
|----------|----------|------|
| | | |

## Technical Details

### Description

_Detailed explanation of the vulnerability_

### Root Cause

_What caused this vulnerability to exist_

### Impact

_What could happen if exploited_

### Proof of Concept

```solidity
// Attack scenario or test case
```

## Recommendation

_How to fix the vulnerability_

### Suggested Fix

```solidity
// Code snippet showing the fix
```

## References

- [Link to relevant documentation or similar findings]

---

## Auditor Notes

_Additional context or observations_

---

## Resolution

### Fix Applied

```solidity
// Show the actual fix that was applied
```

### Verification

- [ ] Fix reviewed
- [ ] Tests added
- [ ] Re-audit passed

### Commit Hash

`<commit-hash>`

---

# Finding Severity Guidelines

## Critical
- Direct loss of funds
- Permanent freezing of funds
- Unauthorized minting/burning
- Complete protocol compromise

## High
- Temporary freezing of funds
- Theft of unclaimed yields
- Incorrect fee calculations leading to significant losses
- Privilege escalation

## Medium
- Griefing attacks
- Temporary DoS
- Incorrect event emissions
- Minor economic impact

## Low
- Gas inefficiencies
- Code quality issues
- Minor logical inconsistencies
- Edge case handling

## Informational
- Best practices
- Code style
- Documentation improvements
- Suggestions

---

# Common Vulnerability Checklist

## Reentrancy
- [ ] All external calls use CEI pattern
- [ ] ReentrancyGuard on state-changing functions
- [ ] No cross-function reentrancy possible

## Access Control
- [ ] onlyOwner on admin functions
- [ ] Role-based access where appropriate
- [ ] No unprotected initialization

## Input Validation
- [ ] Zero address checks
- [ ] Zero amount checks
- [ ] Array length validation
- [ ] Deadline validation

## Arithmetic
- [ ] Using Solidity 0.8+ (built-in overflow)
- [ ] Safe casting
- [ ] Division by zero prevention
- [ ] Precision loss considered

## Oracle
- [ ] Staleness checks
- [ ] Price deviation limits
- [ ] Fallback oracles
- [ ] Decimal handling

## Token Integration
- [ ] Using SafeERC20
- [ ] Fee-on-transfer handling
- [ ] Rebasing token handling
- [ ] Return value checks

## Front-running
- [ ] Slippage protection
- [ ] Deadline parameters
- [ ] Commit-reveal where needed

## Denial of Service
- [ ] No unbounded loops
- [ ] Pull over push payments
- [ ] Gas limits considered
