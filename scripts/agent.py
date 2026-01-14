#!/usr/bin/env python3
"""
ChainHopper Agent Interface

Unified interface for agent operations. Defaults to Claude Code Max,
but designed for swappable providers.

Usage:
    agent.py implement --issue 42
    agent.py review --pr 42
    agent.py security-review --pr 42
    agent.py --provider ollama review --pr 42
"""

import argparse
import subprocess
import sys
import os
import yaml
from pathlib import Path

# Find config relative to script location
SCRIPT_DIR = Path(__file__).parent.parent
CONFIG_PATH = SCRIPT_DIR / ".agent" / "config.yml"
PROMPTS_DIR = SCRIPT_DIR / ".agent" / "prompts"


def load_config():
    """Load agent configuration."""
    if not CONFIG_PATH.exists():
        print(f"Config not found at {CONFIG_PATH}")
        sys.exit(1)
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def load_prompt(name: str) -> str:
    """Load a prompt template."""
    prompt_path = PROMPTS_DIR / f"{name}.md"
    if not prompt_path.exists():
        print(f"Prompt not found: {prompt_path}")
        sys.exit(1)
    return prompt_path.read_text()


def run_claude_code(prompt: str, print_only: bool = False) -> int:
    """Execute via Claude Code CLI (Max subscription)."""
    cmd = ["claude"]
    if print_only:
        cmd.append("--print")
    cmd.append(prompt)

    print(f"Running: claude {'--print ' if print_only else ''}<prompt>")
    print("-" * 50)

    result = subprocess.run(cmd, cwd=SCRIPT_DIR)
    return result.returncode


def get_repo_info() -> tuple[str, str]:
    """Get current repo owner/name from git remote."""
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            capture_output=True, text=True, cwd=SCRIPT_DIR
        )
        url = result.stdout.strip()
        # Parse git@github.com:owner/repo.git or https://github.com/owner/repo.git
        if "github.com" in url:
            if url.startswith("git@"):
                path = url.split(":")[1]
            else:
                path = url.split("github.com/")[1]
            path = path.replace(".git", "")
            owner, repo = path.split("/")
            return owner, repo
    except Exception:
        pass
    return None, None


def cmd_implement(args, config):
    """Implement a GitHub issue."""
    owner, repo = get_repo_info()
    issue_ref = f"#{args.issue}" if owner else f"issue {args.issue}"

    base_prompt = load_prompt("implement")

    prompt = f"""Read GitHub issue {issue_ref} and implement it.

{base_prompt.replace('{task_description}', f'See issue {issue_ref}')}
{base_prompt.replace('{issue_number}', str(args.issue))}

Steps:
1. Read the issue to understand requirements
2. Create branch: agent/{args.issue}
3. Implement the solution
4. Run tests if applicable
5. Commit with meaningful messages
6. Create a PR linking to the issue
"""

    return run_claude_code(prompt, args.print_only)


def cmd_review(args, config):
    """Review a pull request."""
    prompt_template = load_prompt("review")

    prompt = f"""Review PR #{args.pr} for this repository.

{prompt_template}

Steps:
1. Read the PR diff and description
2. Check against the review criteria
3. If issues found, post a review comment on the PR
4. If LGTM, approve the PR (or post approval comment)
"""

    return run_claude_code(prompt, args.print_only)


def cmd_security_review(args, config):
    """Security-focused review of a pull request."""
    prompt_template = load_prompt("security")

    prompt = f"""Perform a security review of PR #{args.pr}.

{prompt_template}

This is a SECURITY review - be thorough and paranoid.
Post findings as a review comment on the PR.
"""

    return run_claude_code(prompt, args.print_only)


def cmd_batch(args, config):
    """Process multiple issues in parallel."""
    issues = [int(i.strip()) for i in args.issues.split(",")]

    print(f"Dispatching {len(issues)} tasks...")
    processes = []

    for issue in issues:
        prompt = f"Read GitHub issue #{issue} and implement it. Create branch agent/{issue}, implement, and create a PR."
        cmd = ["claude", "--print", prompt]
        print(f"  Starting issue #{issue}...")
        proc = subprocess.Popen(cmd, cwd=SCRIPT_DIR)
        processes.append((issue, proc))

    # Wait for all
    print("\nWaiting for all tasks to complete...")
    for issue, proc in processes:
        proc.wait()
        status = "done" if proc.returncode == 0 else "failed"
        print(f"  Issue #{issue}: {status}")

    return 0


def main():
    parser = argparse.ArgumentParser(
        description="ChainHopper Agent Interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s implement --issue 42
  %(prog)s review --pr 42
  %(prog)s security-review --pr 42
  %(prog)s batch --issues "42,43,44"
  %(prog)s --provider ollama review --pr 42
        """
    )

    parser.add_argument(
        "--provider",
        default="claude-code",
        help="Agent provider (default: claude-code)"
    )
    parser.add_argument(
        "--print-only",
        action="store_true",
        help="Run in print mode (non-interactive)"
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # implement command
    impl_parser = subparsers.add_parser("implement", help="Implement a GitHub issue")
    impl_parser.add_argument("--issue", "-i", type=int, required=True, help="Issue number")

    # review command
    review_parser = subparsers.add_parser("review", help="Review a pull request")
    review_parser.add_argument("--pr", "-p", type=int, required=True, help="PR number")

    # security-review command
    sec_parser = subparsers.add_parser("security-review", help="Security review a PR")
    sec_parser.add_argument("--pr", "-p", type=int, required=True, help="PR number")

    # batch command
    batch_parser = subparsers.add_parser("batch", help="Process multiple issues")
    batch_parser.add_argument("--issues", required=True, help="Comma-separated issue numbers")

    args = parser.parse_args()
    config = load_config()

    # Dispatch to appropriate handler
    if args.provider != "claude-code":
        print(f"Provider '{args.provider}' not yet implemented.")
        print("Currently only claude-code (Max subscription) is supported.")
        print("Other providers can be added to scripts/agent.py as needed.")
        sys.exit(1)

    commands = {
        "implement": cmd_implement,
        "review": cmd_review,
        "security-review": cmd_security_review,
        "batch": cmd_batch,
    }

    handler = commands.get(args.command)
    if handler:
        sys.exit(handler(args, config))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
