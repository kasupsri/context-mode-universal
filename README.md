# windows-context-mode

Windows-first MCP server for context compression, safe execution, and token-savings telemetry.

## What it does

- Executes commands in a sandbox with **PowerShell-first** runtime selection.
- Enforces **strict Windows safety policies** before execution.
- Compresses large outputs so only compact summaries enter model context.
- Indexes content into a searchable knowledge base (BM25).
- Tracks and reports bytes/tokens saved (`stats_get`, `stats_export`).

## Install

### Cursor

```powershell
npx -y windows-context-mode setup cursor
```

### Codex CLI (VS Code/Codex)

```powershell
codex mcp add context-mode -- npx -y windows-context-mode
codex mcp list
```

If you only use the VS Code extension and do not have the `codex` CLI, add this to `%USERPROFILE%\.codex\config.toml`:

```toml
[mcp_servers.context-mode]
command = "npx"
args = ["-y", "windows-context-mode"]
```

## Quick setup (Windows)

Use the bootstrap script to install deps, build, test, run doctor, and configure Cursor/Codex:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

Optional flags:

- `-SkipInstall`
- `-SkipBuild`
- `-SkipTests`
- `-SkipDoctor`
- `-SkipCursor`
- `-SkipCodex`

When `codex` CLI is missing, `setup.ps1` now falls back to updating `%USERPROFILE%\.codex\config.toml` for extension-based setup.

## Tools

- `execute`
- `execute_file`
- `compress`
- `index`
- `search`
- `fetch_and_index`
- `proxy`
- `stats_get`
- `stats_reset`
- `stats_export`
- `doctor`

## Environment variables

- `WCM_THRESHOLD_BYTES`
- `WCM_MAX_OUTPUT_BYTES`
- `WCM_TIMEOUT_MS`
- `WCM_SHELL` (`powershell|cmd|git-bash`)
- `WCM_POLICY_MODE` (`strict|balanced|permissive`)
- `WCM_DB_PATH`
- `WCM_STATS_FOOTER` (`true|false`)
- `WCM_STATS_EXPORT_PATH`

## Development

```powershell
npm install
npm run build
npm test
```

## Security defaults

`strict` mode is enabled by default. Destructive patterns like recursive deletes, format/disk tools, registry deletes, and script-download-execute chains are blocked.

## Credits

`windows-context-mode` is a Windows-focused adaptation of [`universal-context-mode`](https://github.com/phanindra208/universal-context-mode) by **phanindra208**. Core architecture, compression strategies, and knowledge base design are derived from that project and reused under the MIT license.

## License

MIT
