# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-01-15

### Added
- Initial release
- 7 MCP tools: `execute`, `execute_file`, `index`, `search`, `fetch_and_index`, `compress`, `proxy`
- 10 language runtimes: JavaScript, TypeScript, Python, Shell, Ruby, Go, Rust, PHP, Perl, R
- Content-type detection and specialized compression for: JSON, logs, code, markdown, CSV, generic
- Intent-driven filtering using TF-IDF scoring (no LLM calls)
- SQLite FTS5 knowledge base with Porter stemming and BM25 ranking
- IDE adapters for: Claude Code, Cursor, Windsurf, GitHub Copilot (VS Code)
- CLI setup command with auto-detection: `npx universal-context-mode setup`
- Auth passthrough for: gh, aws, gcloud, kubectl, docker
- Heading-aware markdown chunking (preserves code blocks)
- Session stats tracking (bytes/tokens saved)
- Comprehensive test suite: unit, integration, benchmarks
- GitHub Actions CI/CD (test, release, weekly benchmark)
