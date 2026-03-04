# Windows Context Mode: How It Works

## End-to-End Request Flow

```mermaid
flowchart TD
    A[Client sends MCP tool call] --> B[Validate tool input]
    B --> C{Safety check required?}
    C -->|yes| D[Evaluate command/path against policy]
    C -->|no| E[Run tool logic]
    D -->|deny| F[Return blocked reason]
    D -->|allow| E
    E --> G[Execute runtime or process content]
    G --> H{Output exceeds threshold?}
    H -->|yes| I[Compress output]
    H -->|no| J[Return raw output]
    I --> K[Record stats: bytes/tokens in/out]
    K --> L[Return compact response]
    J --> L
```

## Shell Runtime Resolution (Windows-First)

`execute` resolves shell runtimes with Windows-first priority:

1. PowerShell (`pwsh`, then `powershell`)
2. `cmd.exe`
3. Git Bash (`bash.exe` from Git for Windows)

Language-specific requests (`powershell`, `cmd`, `bash`) force a matching preference before fallback.

```mermaid
flowchart TD
    R[shell command request] --> P{Preferred runtime available?}
    P -->|yes| OK[Run with preferred runtime]
    P -->|no| F1[Try next fallback]
    F1 --> F2{Any fallback available?}
    F2 -->|yes| OK
    F2 -->|no| X[Return runtime unavailable error]
```

## Safety and Policy Modes

Policy evaluation happens before execution:

- `strict` (default): blocks destructive commands and script-download-execute chains.
- `balanced`: blocks high-risk commands and flags some destructive commands for confirmation-style handling.
- `permissive`: allows commands broadly, but still protects sensitive file paths (for example `.env`, private keys).

## Compression and Stats

- Large outputs are compressed using deterministic, content-aware strategies.
- Compression tracks session-level bytes/tokens saved.
- `stats_get` returns in-memory totals and per-tool breakdown.
- `stats_export` writes a JSON report (default location under `%TEMP%`).

## Knowledge Base Path

`index` and `fetch_and_index` store chunked content in SQLite (FTS5 + BM25).  
`search` returns ranked passages for query-driven recall.

## Diagnostics

`doctor` reports:

- active platform/runtime details
- resolved default shell
- policy mode
- compression and timeout config
- safety self-check sample results
