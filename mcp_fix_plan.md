# MCP Configuration Fix Plan

## Issues Identified:
1. GitHub MCP server has empty environment variables
2. The server might not be properly initialized

## Proposed Fix for `.kilocode/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "-e",
        "GITHUB_TOOLSETS",
        "-e",
        "GITHUB_READ_ONLY",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "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",
        "GITHUB_TOOLSETS": "repositories,issues,pull_requests,actions",
        "GITHUB_READ_ONLY": "true"
      }
    }
  }
}
```

## Changes Needed:
1. Set `GITHUB_TOOLSETS` to "repositories,issues,pull_requests,actions"
2. Set `GITHUB_READ_ONLY` to "true" for safety
3. Test the git MCP server as alternative

## Alternative Approach:
If GitHub MCP continues to have issues, we can use the git MCP server that's already configured to point to your repository.

## Next Steps:
1. Switch to Code mode to apply the configuration changes
2. Test GitHub MCP connectivity
3. Use the working MCP server to examine the FrameForge repository