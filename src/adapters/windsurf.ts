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

const CASCADE_RULES = `# Context Mode Rules

Use context-mode tools for shell/files/docs/large output.
Defaults:
- response_mode: "minimal"
- max_output_tokens: 400
- search with compact output
Use response_mode: "full" only on demand.
`;

export class WindsurfAdapter implements BaseAdapter {
  readonly ideName = 'Windsurf';
  readonly detectionPaths = ['.windsurf'];

  async detect(cwd: string): Promise<boolean> {
    try {
      await access(join(cwd, '.windsurf'));
      return true;
    } catch {
      return false;
    }
  }

  async setup(config: AdapterConfig): Promise<SetupResult> {
    const filesCreated: string[] = [];
    const windsurfDir = join(config.projectRoot, '.windsurf');

    await mkdir(windsurfDir, { recursive: true });

    // Write MCP config
    const mcpConfigPath = join(windsurfDir, 'mcp.json');
    await writeFile(mcpConfigPath, MCP_CONFIG(config.serverPackage), 'utf8');
    filesCreated.push(mcpConfigPath);

    // Write cascade rules
    const rulesPath = join(windsurfDir, 'cascade-rules.md');
    await writeFile(rulesPath, CASCADE_RULES, 'utf8');
    filesCreated.push(rulesPath);

    return {
      ide: this.ideName,
      filesCreated,
      nextSteps: [
        '1. Restart Windsurf to load the new MCP server',
        '2. Open Settings → MCP to verify "context-mode" appears',
        '3. The Cascade rules will guide the AI toward minimum-token outputs',
      ],
    };
  }
}
