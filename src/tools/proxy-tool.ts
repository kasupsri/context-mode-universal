import { type CompressionStrategy } from '../compression/strategies.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { executeCode } from '../sandbox/executor.js';
import { type Language, type ShellRuntime } from '../sandbox/runtimes.js';
import {
  denyReason,
  evaluateCommand,
  evaluateFilePath,
  extractShellCommands,
} from '../security/policy.js';
import { readFile, stat } from 'fs/promises';

export interface ProxyToolInput {
  tool: string;
  args: Record<string, unknown>;
  intent?: string;
  strategy?: CompressionStrategy;
  max_output_tokens?: number;
}

export async function proxyTool(input: ProxyToolInput): Promise<string> {
  let rawOutput: string;

  switch (input.tool) {
    case 'execute':
    case 'bash': {
      const lang = (input.args['language'] as Language | undefined) ?? 'shell';
      const code =
        (input.args['code'] as string | undefined) ??
        (input.args['command'] as string | undefined) ??
        '';
      const shellRuntime = input.args['shell_runtime'] as ShellRuntime | undefined;
      const requestedTimeout = input.args['timeout'];
      const timeout =
        typeof requestedTimeout === 'number' &&
        Number.isFinite(requestedTimeout) &&
        requestedTimeout > 0
          ? Math.floor(requestedTimeout)
          : DEFAULT_CONFIG.sandbox.timeoutMs;

      if (
        lang === 'shell' ||
        lang === 'powershell' ||
        lang === 'cmd' ||
        lang === 'bash' ||
        lang === 'sh'
      ) {
        const decision = evaluateCommand(code);
        if (decision.decision === 'deny' || decision.decision === 'ask') {
          return denyReason(decision);
        }
      } else {
        const embedded = extractShellCommands(code, lang);
        for (const cmd of embedded) {
          const decision = evaluateCommand(cmd);
          if (decision.decision === 'deny' || decision.decision === 'ask') {
            return denyReason(decision);
          }
        }
      }

      const result = await executeCode({
        language: lang,
        code,
        shellRuntime,
        timeoutMs: timeout,
        allowAuthPassthrough: DEFAULT_CONFIG.sandbox.allowAuthPassthrough,
      });
      rawOutput = result.stdout;
      if (result.stderr) {
        rawOutput += `${rawOutput ? '\n' : ''}STDERR:\n${result.stderr}`;
      }
      if (result.timedOut) {
        rawOutput = `[TIMEOUT after ${timeout}ms]\n${rawOutput}`;
      }
      if (result.exitCode !== 0 && !result.timedOut) {
        rawOutput += `\n[Exit code: ${result.exitCode}]`;
      }
      break;
    }

    case 'read_file': {
      const filePath = input.args['path'] as string | undefined;
      if (!filePath) {
        return 'Error: proxy(read_file) requires args.path';
      }
      const denied = evaluateFilePath(filePath);
      if (denied.denied) {
        return `Blocked by security policy: file path matches "${denied.matchedPattern}"`;
      }

      let fileStats;
      try {
        fileStats = await stat(filePath);
      } catch (err) {
        return `Error reading file "${filePath}": ${String(err)}`;
      }

      if (!fileStats.isFile()) {
        return `Error reading file "${filePath}": path is not a regular file`;
      }

      if (fileStats.size > DEFAULT_CONFIG.sandbox.maxFileBytes) {
        return [
          `Error reading file "${filePath}": file is too large for proxy(read_file).`,
          `Size: ${fileStats.size} bytes, limit: ${DEFAULT_CONFIG.sandbox.maxFileBytes} bytes.`,
        ].join('\n');
      }

      try {
        rawOutput = await readFile(filePath, 'utf8');
      } catch (err) {
        return `Error reading file "${filePath}": ${String(err)}`;
      }
      break;
    }

    default: {
      return [
        `The proxy tool cannot directly invoke "${input.tool}" ` +
          '(MCP servers cannot call other MCP tools).',
        '',
        'Instead, capture the output yourself and pipe it through the compress tool:',
        '',
        '```',
        'compress({',
        `  content: <output from ${input.tool}>,`,
        input.intent ? `  intent: "${input.intent}",` : '',
        '})',
        '```',
        '',
        'Or use execute() with shell to run CLI commands and get compressed output.',
      ]
        .filter(Boolean)
        .join('\n');
    }
  }

  return rawOutput;
}
