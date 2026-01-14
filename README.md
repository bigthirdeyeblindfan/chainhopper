# ChainHopper

Multi-chain trading bot with profit-share fee model.

## Agent Infrastructure

This repo uses Claude Code Max for AI-assisted development with a GitHub-centric workflow.

### Quick Start

```bash
# Implement a GitHub issue
python scripts/agent.py implement --issue 42

# Or directly via Claude Code
claude "Read issue #42 and implement it. Create a PR when done."

# Review a PR
python scripts/agent.py review --pr 42

# Security review
python scripts/agent.py security-review --pr 42

# Batch process multiple issues
python scripts/agent.py batch --issues "42,43,44"
```

### Workflow

```
Issue Created → Agent Implements → PR Created → CI Runs → Human Reviews → Merge
```

1. Create an issue using the "Agent Task" template
2. Run `agent.py implement --issue <N>` or ask Claude directly
3. Agent creates branch `agent/<issue-number>`
4. Agent implements, commits, creates PR
5. CI runs (tests, lint, security scans)
6. You review and merge

### Project Structure

```
chainhopper/
├── .agent/                 # Agent configuration
│   ├── config.yml          # Provider config (Claude Code default)
│   └── prompts/            # Task prompts (implement, review, security)
├── .github/
│   ├── workflows/ci.yml    # CI pipeline (no API keys needed)
│   └── ISSUE_TEMPLATE/     # Agent task template
├── scripts/
│   └── agent.py            # Unified agent interface
├── apps/                   # Applications (web, bot, api)
├── packages/               # Shared packages (core, adapters, contracts)
└── docs/                   # Documentation
```

### Configuration

See `.agent/config.yml` for provider configuration. Default is `claude-code` (Max subscription).

Future providers can be added:
- `anthropic-api` - For CI/CD automation
- `ollama` - Local models for offline/private work
- `openai` - Model diversity
- `cerebras` - Fast inference

### Requirements

- Claude Code Max subscription
- GitHub CLI (`gh`) authenticated
- Python 3.10+
- Node.js 20+
