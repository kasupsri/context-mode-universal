import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { executeTool } from './tools/execute.js';
import { executeFileTool } from './tools/execute-file.js';
import { indexContentTool } from './tools/index-content.js';
import { searchTool } from './tools/search.js';
import { fetchAndIndexTool } from './tools/fetch-and-index.js';
import { compressTool } from './tools/compress.js';
import { proxyTool } from './tools/proxy-tool.js';
import { statsGetTool } from './tools/stats-get.js';
import { statsResetTool } from './tools/stats-reset.js';
import { statsExportTool } from './tools/stats-export.js';
import { doctorTool } from './tools/doctor.js';
import { logger } from './utils/logger.js';

const TOOLS: Tool[] = [
  {
    name: 'execute',
    description:
      'Execute code in a sandboxed subprocess. Windows-first shell behavior uses PowerShell by default, with cmd and optional Git Bash fallback. Strict safety policies are enforced before execution.',
    inputSchema: {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          enum: [
            'javascript',
            'js',
            'typescript',
            'ts',
            'python',
            'py',
            'shell',
            'powershell',
            'cmd',
            'bash',
            'sh',
            'ruby',
            'rb',
            'go',
            'rust',
            'rs',
            'php',
            'perl',
            'pl',
            'r',
          ],
        },
        code: { type: 'string' },
        intent: { type: 'string' },
        timeout: { type: 'number' },
        max_output_tokens: { type: 'number' },
        shell_runtime: { type: 'string', enum: ['powershell', 'cmd', 'git-bash'] },
      },
      required: ['language', 'code'],
    },
  },
  {
    name: 'execute_file',
    description:
      'Process a file in a sandboxed JavaScript runtime. File path deny rules are enforced before execution.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        code: { type: 'string' },
        intent: { type: 'string' },
        timeout: { type: 'number' },
      },
      required: ['file_path', 'code'],
    },
  },
  {
    name: 'index',
    description: 'Index markdown/text content into BM25-searchable chunks.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        source: { type: 'string' },
        kb_name: { type: 'string' },
        chunk_size: { type: 'number' },
      },
      required: ['content'],
    },
  },
  {
    name: 'search',
    description: 'Search indexed knowledge base content.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        kb_name: { type: 'string' },
        top_k: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'fetch_and_index',
    description: 'Fetch a URL, convert to markdown/text, and index for search.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        kb_name: { type: 'string' },
        chunk_size: { type: 'number' },
      },
      required: ['url'],
    },
  },
  {
    name: 'compress',
    description: 'Compress large content by content-type-aware algorithmic strategies.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        intent: { type: 'string' },
        strategy: { type: 'string', enum: ['auto', 'truncate', 'summarize', 'filter'] },
        max_output_tokens: { type: 'number' },
      },
      required: ['content'],
    },
  },
  {
    name: 'proxy',
    description: 'Proxy common tool-like actions and compress output before returning to context.',
    inputSchema: {
      type: 'object',
      properties: {
        tool: { type: 'string' },
        args: { type: 'object' },
        intent: { type: 'string' },
        strategy: { type: 'string', enum: ['auto', 'truncate', 'summarize', 'filter'] },
        max_output_tokens: { type: 'number' },
      },
      required: ['tool', 'args'],
    },
  },
  {
    name: 'stats_get',
    description: 'Show session token/context savings and per-tool breakdown.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'stats_reset',
    description: 'Reset in-memory session compression statistics.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'stats_export',
    description: 'Export session stats JSON to a file (default: %TEMP%).',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
    },
  },
  {
    name: 'doctor',
    description: 'Run local diagnostics for runtime resolution, policy mode, and safety checks.',
    inputSchema: { type: 'object', properties: {} },
  },
];

export function createServer(): { server: Server; transport: StdioServerTransport } {
  const server = new Server(
    {
      name: 'windows-context-mode',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, () => Promise.resolve({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;
    logger.debug('Tool called', { name, args });

    try {
      let result: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const typedArgs = (args ?? {}) as any;

      switch (name) {
        case 'execute':
          result = await executeTool(typedArgs as Parameters<typeof executeTool>[0]);
          break;
        case 'execute_file':
          result = await executeFileTool(typedArgs as Parameters<typeof executeFileTool>[0]);
          break;
        case 'index':
          result = await indexContentTool(typedArgs as Parameters<typeof indexContentTool>[0]);
          break;
        case 'search':
          result = await searchTool(typedArgs as Parameters<typeof searchTool>[0]);
          break;
        case 'fetch_and_index':
          result = await fetchAndIndexTool(typedArgs as Parameters<typeof fetchAndIndexTool>[0]);
          break;
        case 'compress':
          result = compressTool(typedArgs as Parameters<typeof compressTool>[0]);
          break;
        case 'proxy':
          result = await proxyTool(typedArgs as Parameters<typeof proxyTool>[0]);
          break;
        case 'stats_get':
          result = statsGetTool();
          break;
        case 'stats_reset':
          result = statsResetTool();
          break;
        case 'stats_export':
          result = await statsExportTool(typedArgs as Parameters<typeof statsExportTool>[0]);
          break;
        case 'doctor':
          result = doctorTool();
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      logger.debug('Tool completed', { name, outputLength: result.length });

      return {
        content: [{ type: 'text', text: result }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Tool error', { name, error: message });
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  return { server, transport };
}

