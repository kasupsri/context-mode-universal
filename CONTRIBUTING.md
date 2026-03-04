# Contributing to windows-context-mode

Thanks for contributing. This repository focuses on a Windows-first MCP server with strong safety defaults and context compression.

## Development Setup

```powershell
git clone https://github.com/kasupsri/windows-context-mode.git
cd windows-context-mode
npm install
npm run build
npm test
```

Optional local bootstrap:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

## Project Layout

```text
src/
  adapters/        IDE setup flows (currently wired: Cursor, Codex)
  compression/     Content-aware compression and chunking
  config/          Defaults and env parsing
  knowledge-base/  SQLite indexing and BM25 search
  sandbox/         Runtime resolution and command execution
  security/        Policy rules and evaluation
  tools/           MCP tool handlers
  utils/           Logging, token estimation, stats tracking

tests/
  unit/            Module-level behavior
  integration/     MCP and index/search integration
  benchmarks/      Compression benchmark tests
```

## Quality Gates

Run these before opening a PR:

```powershell
npm run lint
npm run format:check
npm run build
npm test
```

If your change affects compression behavior:

```powershell
npm run benchmark
```

## Contribution Guidelines

- Keep compression algorithmic and deterministic (no external model/API dependency).
- Preserve Windows-first behavior for shell runtime resolution and safety policy defaults.
- Add or update tests for behavior changes.
- Keep docs in sync with real command names, tool names, and setup flow.
- Avoid broad unrelated refactors in the same PR.

## Adding or Updating an MCP Tool

1. Implement/update tool logic in `src/tools/`.
2. Register schema and handler mapping in `src/server.ts`.
3. Add unit/integration coverage in `tests/`.
4. Update `README.md` tool docs if user-facing behavior changes.

## Adding a New IDE Setup Adapter

1. Implement `BaseAdapter` in `src/adapters/`.
2. Add detection/setup behavior and file output.
3. Register it in `src/adapters/generic.ts`.
4. Document setup commands and caveats in `README.md`.
5. Add tests or verification notes in your PR.

## Pull Requests

1. Fork and create a branch (`feat/*`, `fix/*`, `docs/*`).
2. Keep commits focused and descriptive.
3. Include a clear PR description with:
- what changed
- why it changed
- how it was tested
- any Windows-specific validation performed

## Reporting Issues

Use:

- [Bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature request template](.github/ISSUE_TEMPLATE/feature_request.md)

Please include Node.js version, Windows version, IDE/client details, and a minimal reproduction.
