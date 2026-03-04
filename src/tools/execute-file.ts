import { executeFile } from '../sandbox/executor.js';
import { compress } from '../compression/strategies.js';
import { statsTracker } from '../utils/stats-tracker.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { denyReason, evaluateCommand, evaluateFilePath, extractShellCommands } from '../security/policy.js';

export interface ExecuteFileToolInput {
  file_path: string;
  code: string;
  intent?: string;
  timeout?: number;
}

function maybeAppendFooter(rawOutput: string, compressedOutput: string, strategy: string): string {
  if (!DEFAULT_CONFIG.stats.footerEnabled) {
    return compressedOutput;
  }
  return compressedOutput + statsTracker.formatStatsFooter(rawOutput, compressedOutput, strategy);
}

export async function executeFileTool(input: ExecuteFileToolInput): Promise<string> {
  const fileCheck = evaluateFilePath(input.file_path);
  if (fileCheck.denied) {
    return `Blocked by security policy: file path matches "${fileCheck.matchedPattern}"`;
  }

  const embeddedCommands = extractShellCommands(input.code, 'javascript');
  for (const cmd of embeddedCommands) {
    const decision = evaluateCommand(cmd);
    if (decision.decision === 'deny' || decision.decision === 'ask') {
      return denyReason(decision);
    }
  }

  const result = await executeFile(input.file_path, input.code, {
    timeoutMs: input.timeout ?? DEFAULT_CONFIG.sandbox.timeoutMs,
  });

  let rawOutput = result.stdout;

  if (result.exitCode !== 0) {
    rawOutput += result.stderr ? `\nSTDERR:\n${result.stderr}` : '';
    rawOutput += `\n[Exit code: ${result.exitCode}]`;
  }

  if (result.timedOut) {
    rawOutput = `[TIMEOUT]\n` + rawOutput;
  }

  const compressed = compress(rawOutput, {
    intent: input.intent,
    maxOutputChars: DEFAULT_CONFIG.compression.maxOutputBytes,
  });

  if (compressed.strategy !== 'as-is') {
    statsTracker.record('execute_file', rawOutput, compressed.output, compressed.strategy);
    return maybeAppendFooter(rawOutput, compressed.output, compressed.strategy);
  }

  return compressed.output;
}

