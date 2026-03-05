import { type BaseAdapter, type AdapterConfig, type SetupResult } from './base-adapter.js';
import { access, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const MCP_CONFIG = (pkg: string) =>
  JSON.stringify(
    {
      mcpServers: {
        'context-mode': {
          command: 'npx',
          args: ['-y', pkg],
        },
      },
    },
    null,
    2
  );

const CURSOR_RULES = `---
description: Always use context-mode-universal for token-efficient tool output
globs: ["**/*"]
alwaysApply: true
---

Use only context-mode-universal tools for shell, large files, docs, and long output.
Default to short responses:
- response_mode: "minimal"
- max_output_tokens: 400
- use search(compact:true) after fetch_and_index/index
`;

export class CursorAdapter implements BaseAdapter {
  readonly ideName = 'Cursor';
  readonly detectionPaths = ['.cursor'];

  async detect(cwd: string): Promise<boolean> {
    try {
      await access(join(cwd, '.cursor'));
      return true;
    } catch {
      return false;
    }
  }

  async setup(config: AdapterConfig): Promise<SetupResult> {
    const filesCreated: string[] = [];
    const cursorDir = join(config.projectRoot, '.cursor');
    const rulesDir = join(cursorDir, 'rules');

    await mkdir(rulesDir, { recursive: true });

    // Write MCP config
    const mcpConfigPath = join(cursorDir, 'mcp.json');
    await writeFile(mcpConfigPath, MCP_CONFIG(config.serverPackage), 'utf8');
    filesCreated.push(mcpConfigPath);

    // Write rules file
    const rulesPath = join(rulesDir, 'context-mode.mdc');
    await writeFile(rulesPath, CURSOR_RULES, 'utf8');
    filesCreated.push(rulesPath);

    return {
      ide: this.ideName,
      filesCreated,
      nextSteps: [
        '1. Restart Cursor to load the new MCP server',
        '2. Open the MCP panel (Ctrl+Shift+P → "MCP: Show Panel") to verify connection',
        '3. The context-mode rules will automatically guide the agent toward minimum-token outputs',
      ],
    };
  }
}
