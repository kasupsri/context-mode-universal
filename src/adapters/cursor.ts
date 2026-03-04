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
description: Route large outputs through windows-context-mode to preserve context window
globs: ["**/*"]
alwaysApply: true
---

## Context Preservation Rules

When executing commands that may produce large output (>5KB), use the \`windows-context-mode\` MCP tools:

- Prefer \`execute({ language: "shell" })\` for PowerShell-first safe execution
- Use \`execute_file\` for large local files
- Use \`fetch_and_index\` + \`search\` for docs
- Use \`compress\` for arbitrary large text
- Use \`stats_get\` to monitor token savings

### Commands likely to produce large output
- \`git log\`, \`git diff\`, \`cat\` large files, \`find\`, reading log files
- \`npm list\`, \`pip list\`, dependency audits, \`yarn why\`
- API responses, test suite output (>100 tests)
- Browser snapshots, web page content, database dumps

### Example usage

\`\`\`
// Instead of: bash("git log --oneline -50")
execute({ language: "shell", code: "git log --oneline -50", intent: "recent changes" })

// Instead of: read_file("package-lock.json")
execute_file({ file_path: "package-lock.json", code: "const d=JSON.parse(process.env.FILE_CONTENT); console.log('Packages:', Object.keys(d.dependencies||{}).length)" })

// Compress any large text
compress({ content: largeOutput, intent: "find error messages" })

// View token/context savings
stats_get({})
\`\`\`
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
        '3. The context-mode rules will automatically guide the agent to compress large outputs',
      ],
    };
  }
}
