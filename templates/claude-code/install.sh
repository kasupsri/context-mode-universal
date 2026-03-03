#!/usr/bin/env bash
# universal-context-mode — Claude Code one-liner installer
set -euo pipefail

echo "Installing universal-context-mode for Claude Code..."

# Add MCP server
claude mcp add context-mode -- npx -y universal-context-mode

echo ""
echo "✓ context-mode installed!"
echo ""
echo "Verify with:"
echo "  claude mcp list"
echo ""
echo "Usage in Claude Code:"
echo "  The context-mode tools are now available in any Claude Code session."
echo "  Tools: execute, execute_file, index, search, fetch_and_index, compress, proxy"
