import { cwd } from 'process';
import { CursorAdapter } from './cursor.js';
import { CodexAdapter } from './codex.js';
import { type BaseAdapter, type SetupResult } from './base-adapter.js';

const ADAPTERS: BaseAdapter[] = [new CursorAdapter(), new CodexAdapter()];
const SERVER_PACKAGE = 'windows-context-mode';

async function detectIde(projectRoot: string): Promise<BaseAdapter | null> {
  for (const adapter of ADAPTERS) {
    if (await adapter.detect(projectRoot)) {
      return adapter;
    }
  }
  return null;
}

export async function runSetup(ideHint?: string): Promise<void> {
  const projectRoot = cwd();
  const config = { projectRoot, serverPackage: SERVER_PACKAGE };

  let adapter: BaseAdapter | null = null;

  if (ideHint && ideHint !== 'auto') {
    const hint = ideHint.toLowerCase();
    adapter =
      ADAPTERS.find(
        a =>
          a.ideName.toLowerCase().includes(hint) ||
          hint.includes(a.ideName.toLowerCase().split(' ')[0]?.toLowerCase() ?? '')
      ) ?? null;

    if (!adapter) {
      // eslint-disable-next-line no-console
      console.error(`Unknown IDE: "${ideHint}"`);
      // eslint-disable-next-line no-console
      console.error(`Available: ${ADAPTERS.map(a => a.ideName).join(', ')}, auto`);
      process.exit(1);
    }
  } else {
    adapter = await detectIde(projectRoot);

    if (!adapter) {
      printManualSetup();
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`Detected IDE: ${adapter.ideName}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Setting up windows-context-mode for ${adapter.ideName}...`);
  const result: SetupResult = await adapter.setup(config);

  if (result.filesCreated.length > 0) {
    // eslint-disable-next-line no-console
    console.log('\nFiles created:');
    for (const f of result.filesCreated) {
      // eslint-disable-next-line no-console
      console.log(`  ✓ ${f}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('\nNext steps:');
  for (const step of result.nextSteps) {
    // eslint-disable-next-line no-console
    console.log(step ? `  ${step}` : '');
  }
}

function printManualSetup(): void {
  // eslint-disable-next-line no-console
  console.log(`
No supported IDE detected in current directory.
Supported IDEs: ${ADAPTERS.map(a => a.ideName).join(', ')}

Manual setup options:
  npx windows-context-mode setup cursor
  npx windows-context-mode setup codex

Codex CLI command:
  codex mcp add context-mode -- npx -y windows-context-mode

Generic MCP config:
  {
    "mcpServers": {
      "context-mode": {
        "command": "npx",
        "args": ["-y", "windows-context-mode"]
      }
    }
  }
`);
}

