# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Rewrote project documentation for Windows-first setup and operations.
- Expanded README with installation paths, environment variables, security modes, and diagnostics.
- Updated contribution guide and issue templates to reference this repository and current workflows.

### Removed
- Deleted unused markdown template files under `templates/` that were not used by runtime setup flow.

## [0.1.0] - 2026-03-04

### Added
- Initial `windows-context-mode` release.
- MCP tools: `execute`, `execute_file`, `index`, `search`, `fetch_and_index`, `compress`, `proxy`, `stats_get`, `stats_reset`, `stats_export`, `doctor`.
- Windows-first shell runtime strategy with fallback (`PowerShell -> cmd -> Git Bash`).
- Configurable policy modes: `strict`, `balanced`, `permissive`.
- Content-aware deterministic compression and intent-based filtering.
- Local SQLite FTS5/BM25 knowledge base indexing and search.
- Setup flows for Cursor and Codex plus PowerShell bootstrap script.
- Session token/bytes savings tracking with export support.
- Unit, integration, and benchmark test coverage.
