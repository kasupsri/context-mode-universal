# Compression Benchmarks

> Last updated: 2026-03-05 | Node.js v22.15.0

All compression is algorithmic — no LLM calls, no API dependencies.
Benchmarks run with `max_output_tokens: 2000` (8KB target output).

## Results

| Content Type | Detected As | Input | Output | Savings | Strategy |
|---|---|---|---|---|---|
| git log (500 commits) | generic | 19.3KB | 0.5KB | **97%** | ultra |
| JSON API (500 users) | json | 72.9KB | 0.3KB | **100%** | ultra |
| Application logs (1000 lines) | log | 47.8KB | 0.3KB | **99%** | ultra |
| Markdown docs (15 sections) | markdown | 41.8KB | 2KB | **95%** | ultra |
| CSV export (500 rows) | csv | 12.9KB | 0.1KB | **100%** | ultra |
| npm list (300 packages) | generic | 6.4KB | 0.3KB | **95%** | ultra |

## Methodology

- Input sizes are realistic examples from real development workflows
- Output target: 8KB (fits comfortably in ~2K tokens)
- All benchmarks run on a single Node.js process (no warm-up)
- Compression is deterministic — same input always produces same output

## What Gets Compressed

| Content | What context-mode does |
|---|---|
| JSON arrays | Shows schema + key names + count + first 3 items |
| Log files | Groups by pattern, surfaces errors/warnings, deduplicates |
| Code | Preserves signatures/comments, strips function bodies |
| Markdown | Heading outline + first sentence per section |
| CSV | Column names + row count + first 5 rows + numeric stats |
| Generic | Head (50 lines) + tail (20 lines) + line count |

## Running Benchmarks

```bash
npm run benchmark
```
