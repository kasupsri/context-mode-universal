# Contributing to universal-context-mode

Thank you for your interest in contributing! This project welcomes contributions from the community.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/phanindra208/universal-context-mode
cd universal-context-mode

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode for development
npm run test:watch
```

## Project Structure

```
src/
├── compression/     # Core compression engine — the heart of the project
├── knowledge-base/  # SQLite FTS5 storage and search
├── sandbox/         # Subprocess execution with auth passthrough
├── adapters/        # IDE-specific setup helpers
├── tools/           # MCP tool implementations (7 tools)
├── config/          # Configuration and defaults
└── utils/           # Shared utilities

tests/
├── unit/            # Unit tests for each module
├── integration/     # End-to-end MCP protocol tests
└── benchmarks/      # Compression ratio benchmarks
```

## TDD Workflow

We practice Test-Driven Development:

1. Write a failing test for the feature/fix
2. Implement the minimum code to make it pass
3. Refactor if needed
4. Ensure all existing tests still pass

```bash
# Run tests in watch mode
npm run test:watch

# Run a specific test file
npx vitest run tests/unit/compression.test.ts

# Run with coverage
npm run test:coverage
```

## Adding a New Compression Strategy

1. Add your strategy to `src/compression/strategies.ts`
2. Add detection logic to `detectContentType()` if needed
3. Wire it into the `compress()` function's switch statement
4. Write unit tests in `tests/unit/compression.test.ts`
5. Add a benchmark case in `tests/benchmarks/compression-ratio.test.ts`

Example:
```typescript
// In strategies.ts
function compressXml(text: string, maxChars: number, intent?: string): string {
  if (intent) return filterByIntent(text, intent, maxChars);
  // Your implementation
}

// Add to detectContentType():
if (trimmed.startsWith('<') && trimmed.includes('</')) return 'xml';

// Add to compress() switch:
case 'xml': output = compressXml(text, maxOutputChars, options.intent); break;
```

## Adding a New IDE Adapter

1. Create `src/adapters/your-ide.ts` implementing `BaseAdapter`
2. Register it in `src/adapters/generic.ts`
3. Create template files in `templates/your-ide/`
4. Add a setup script in `scripts/setup-your-ide.sh`
5. Document in README.md

```typescript
// src/adapters/your-ide.ts
export class YourIdeAdapter implements BaseAdapter {
  readonly ideName = 'Your IDE';
  readonly detectionPaths = ['.youride'];

  async detect(cwd: string): Promise<boolean> {
    // Check for IDE-specific directory/files
  }

  async setup(config: AdapterConfig): Promise<SetupResult> {
    // Write MCP config and rules files
  }
}
```

## Code Style

- TypeScript strict mode
- ESM modules (`import`/`export`, not `require`)
- No `any` types without a comment explaining why
- Functions should be pure where possible
- No LLM API calls in compression logic — keep it algorithmic

```bash
# Lint
npm run lint

# Format
npm run format
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Write tests first (TDD)
4. Implement the feature
5. Ensure all tests pass: `npm test`
6. Run linting: `npm run lint`
7. Submit a PR with a clear description

## PR Template

```markdown
## What
Brief description of the change.

## Why
Why is this change needed?

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Benchmarks run (if compression-related)

## IDE Compatibility
- [ ] Tested with Claude Code
- [ ] Tested with Cursor (if adapter change)
- [ ] Tested with Windsurf (if adapter change)
```

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md).

Include:
- universal-context-mode version
- Node.js version
- IDE and version
- Minimal reproduction

## Questions?

Open a [Discussion](https://github.com/phanindra208/universal-context-mode/discussions) for questions and ideas.
