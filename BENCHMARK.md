# Compression Benchmarks

> Benchmarks are generated automatically weekly. Run locally with `npm run benchmark`.

All compression is algorithmic — no LLM calls, no API dependencies.
Benchmarks run with `max_output_tokens: 2000` (8KB target output).

## Results

| Content Type | Detected As | Input | Output | Savings | Strategy |
|---|---|---|---|---|---|
| git log (500 commits) | generic | 28.1KB | 3.9KB | **86%** | summarize |
| JSON API (500 users) | json | 94.7KB | 0.8KB | **99%** | summarize |
| Application logs (1000 lines) | log | 61.8KB | 2.9KB | **95%** | summarize |
| Markdown docs (15 sections) | markdown | 47.6KB | 1.9KB | **96%** | summarize |
| CSV export (500 rows) | csv | 22.4KB | 0.6KB | **97%** | summarize |
| npm list (300 packages) | generic | 11.8KB | 1.2KB | **90%** | summarize |
| Docker ps (100 containers) | generic | 14.2KB | 2.1KB | **85%** | summarize |

## Methodology

- Input sizes are realistic examples from real development workflows
- Output target: 8KB (fits comfortably in ~2K tokens)
- All benchmarks run on a single Node.js process (no warm-up)
- Compression is deterministic — same input always produces same output

## What Gets Compressed

| Content | What context-mode does |
|---|---|
| JSON arrays | Shows schema + key names + count + first 3 items |
| JSON objects | Shows key names + value types + nested structure (2 levels) |
| Log files | Groups by pattern, surfaces errors/warnings, deduplicates |
| Code | Preserves signatures/imports/comments, strips function bodies |
| Markdown | Heading outline + first 3 lines per section |
| CSV | Column names + row count + first 5 rows + numeric stats |
| Generic | Head (50 lines) + tail (20 lines) + line count |

## Running Benchmarks

```bash
npm run benchmark
```

Or run the benchmark test suite:

```bash
npx vitest run tests/benchmarks/
```
