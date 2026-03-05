import { DEFAULT_CONFIG } from '../config/defaults.js';
import { type ResponseMode } from '../config/defaults.js';
import { getAvailableRuntimes, getRuntimeForLanguage } from '../sandbox/runtimes.js';
import { evaluateCommand, evaluateFilePath } from '../security/policy.js';

export interface DoctorToolInput {
  max_output_tokens?: number;
  response_mode?: ResponseMode;
}

export function doctorTool(input: DoctorToolInput = {}): string {
  const runtimes = getAvailableRuntimes();
  const shell = getRuntimeForLanguage('shell', DEFAULT_CONFIG.sandbox.shellDefault);
  const shellRuntime = shell?.runtimeId ?? shell?.command ?? 'unavailable';

  const riskyCommand =
    process.platform === 'win32'
      ? 'Remove-Item -Recurse -Force C:\\temp\\danger'
      : 'rm -rf /tmp/danger';
  const riskyEval = evaluateCommand(riskyCommand);
  const envEval = evaluateFilePath('.env');
  const responseMode = input.response_mode ?? DEFAULT_CONFIG.compression.responseMode;

  if (responseMode !== 'full') {
    return [
      'doctor',
      `platform=${process.platform}`,
      `node=${process.version}`,
      `shell=${shellRuntime}`,
      `policy=${DEFAULT_CONFIG.security.policyMode}`,
      `fetch_private=${DEFAULT_CONFIG.security.allowPrivateNetworkFetch ? '1' : '0'}`,
      `timeout_ms=${DEFAULT_CONFIG.sandbox.timeoutMs}`,
      `max_file=${DEFAULT_CONFIG.sandbox.maxFileBytes}`,
      `max_fetch=${DEFAULT_CONFIG.knowledgeBase.maxFetchBytes}`,
      `max_tokens_default=${DEFAULT_CONFIG.compression.defaultMaxOutputTokens}`,
      `max_tokens_hard=${DEFAULT_CONFIG.compression.hardMaxOutputTokens}`,
      `runtime_count=${runtimes.length}`,
      `safety_cmd=${riskyEval.decision}`,
      `safety_env=${envEval.denied ? 'deny' : 'allow'}`,
    ].join('\n');
  }

  const lines = [
    '=== Context Mode Universal Doctor ===',
    `Platform: ${process.platform}`,
    `Node: ${process.version}`,
    `Default shell: ${DEFAULT_CONFIG.sandbox.shellDefault}`,
    `Resolved shell runtime: ${shellRuntime}`,
    `Policy mode: ${DEFAULT_CONFIG.security.policyMode}`,
    `Private-network fetches: ${DEFAULT_CONFIG.security.allowPrivateNetworkFetch ? 'allowed' : 'blocked'}`,
    `Stats max events: ${DEFAULT_CONFIG.stats.maxEvents}`,
    `Max output bytes: ${DEFAULT_CONFIG.compression.maxOutputBytes} bytes`,
    `Execution timeout: ${DEFAULT_CONFIG.sandbox.timeoutMs} ms`,
    `Max execute_file size: ${DEFAULT_CONFIG.sandbox.maxFileBytes} bytes`,
    `Auth passthrough: ${DEFAULT_CONFIG.sandbox.allowAuthPassthrough ? 'enabled' : 'disabled'}`,
    `Max fetch size: ${DEFAULT_CONFIG.knowledgeBase.maxFetchBytes} bytes`,
    `Knowledge base path: ${DEFAULT_CONFIG.knowledgeBase.dbPath}`,
    '',
    `Available runtimes (${runtimes.length}):`,
    ...runtimes.map(r => `- ${r.language}: ${r.command}`),
    '',
    `Safety self-check (command): ${riskyEval.decision.toUpperCase()} (${riskyEval.matchedPattern ?? 'n/a'})`,
    `Safety self-check (.env path): ${envEval.denied ? 'DENY' : 'ALLOW'} (${envEval.matchedPattern ?? 'n/a'})`,
  ];

  return lines.join('\n');
}
