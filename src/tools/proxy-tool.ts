import { compress, type CompressionStrategy } from '../compression/strategies.js';
import { statsTracker } from '../utils/stats-tracker.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { executeCode } from '../sandbox/executor.js';
import { type Language, type ShellRuntime } from '../sandbox/runtimes.js';
import { denyReason, evaluateCommand, evaluateFilePath, extractShellCommands } from '../security/policy.js';

export interface ProxyToolInput {
  tool: string;
  args: Record<string, unknown>;
  intent?: string;
  strategy?: CompressionStrategy;
  max_output_tokens?: number;
}

function maybeAppendFooter(rawOutput: string, compressedOutput: string, strategy: string): string {
  if (!DEFAULT_CONFIG.stats.footerEnabled) {
    return compressedOutput;
  }
  return compressedOutput + statsTracker.formatStatsFooter(rawOutput, compressedOutput, strategy);
}

export async function proxyTool(input: ProxyToolInput): Promise<string> {
  const maxChars = input.max_output_tokens
    ? input.max_output_tokens * 4
    : DEFAULT_CONFIG.compression.maxOutputBytes;

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

      if (lang === 'shell' || lang === 'powershell' || lang === 'cmd' || lang === 'bash' || lang === 'sh') {
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

      const result = await executeCode({ language: lang, code, shellRuntime });
      rawOutput = result.stdout;
      if (result.exitCode !== 0 && result.stderr) {
        rawOutput += `\nSTDERR:\n${result.stderr}`;
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
      const { readFile } = await import('fs/promises');
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

  const compressed = compress(rawOutput, {
    intent: input.intent,
    strategy: input.strategy ?? 'auto',
    maxOutputChars: maxChars,
  });

  if (compressed.strategy !== 'as-is') {
    statsTracker.record(`proxy:${input.tool}`, rawOutput, compressed.output, compressed.strategy);
    return maybeAppendFooter(rawOutput, compressed.output, compressed.strategy);
  }

  return compressed.output;
}
