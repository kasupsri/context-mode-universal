# Windows Context Mode: How it Works

## End-to-end flow

```mermaid
flowchart TD
    A[User request] --> B[MCP tool call]
    B --> C{Safety policy check}
    C -->|deny| D[Return blocked reason]
    C -->|allow| E[Sandbox executor]
    E --> F[PowerShell-first runtime]
    F --> G[Capture stdout/stderr]
    G --> H{Large output?}
    H -->|yes| I[Compress + record stats]
    H -->|no| J[Return output]
    I --> K[(KB index/search optional)]
    K --> L[Compact context response]
    J --> L
```

## Windows shell strategy

```mermaid
flowchart TD
    R[language shell] --> P{PowerShell available?}
    P -->|yes| PS[pwsh/powershell]
    P -->|no| C{cmd.exe available?}
    C -->|yes| CMD[cmd.exe]
    C -->|no| B{Git Bash available?}
    B -->|yes| GB[Git Bash]
    B -->|no| X[Runtime unavailable]
```

## Telemetry

- Every compressed event records bytes/tokens in/out.
- `stats_get` shows session totals and per-tool savings.
- `stats_export` writes JSON report (default `%TEMP%`).

