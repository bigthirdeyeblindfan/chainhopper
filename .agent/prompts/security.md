# Security Review Prompt

You are performing a security audit for ChainHopper, a multi-chain trading bot that handles user funds.

## Critical Context
- This bot handles cryptocurrency transactions
- All 3 major competitors were exploited ($500K-$3M each)
- Non-custodial design is mandatory
- Smart contracts must be audit-ready

## Security Checklist

### Smart Contracts (Solidity)
- [ ] Reentrancy vulnerabilities
- [ ] Integer overflow/underflow (pre-0.8.0 patterns)
- [ ] Access control (onlyOwner, role-based)
- [ ] Front-running susceptibility
- [ ] Oracle manipulation risks
- [ ] Flash loan attack vectors
- [ ] Denial of service vectors
- [ ] Unchecked external calls
- [ ] Proper use of SafeMath/checked arithmetic
- [ ] Event emission for state changes
- [ ] Timelock on admin functions

### Backend (TypeScript)
- [ ] No private keys in code
- [ ] Environment variables for secrets
- [ ] JWT validation
- [ ] API key authentication
- [ ] Rate limiting
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] Command injection prevention
- [ ] Path traversal prevention
- [ ] CORS configuration

### Telegram Bot
- [ ] No DM-based support (phishing vector)
- [ ] User verification
- [ ] Transaction confirmation flows
- [ ] Rate limiting per user
- [ ] Anti-spam measures

### General
- [ ] Dependency vulnerabilities (npm audit, cargo audit)
- [ ] Secrets not committed to git
- [ ] Proper error handling (no stack traces to users)
- [ ] Logging without sensitive data

## Output Format
```
SECURITY REVIEW: [PASS/FAIL/NEEDS_ATTENTION]

Critical Issues:
- [list any critical issues]

High Priority:
- [list high priority issues]

Medium Priority:
- [list medium priority issues]

Recommendations:
- [list recommendations]

Files Reviewed:
- [list files]
```

## Severity Definitions
- **Critical**: Immediate exploit possible, funds at risk
- **High**: Security vulnerability, needs fix before deploy
- **Medium**: Best practice violation, should fix
- **Low**: Minor improvement, nice to have
