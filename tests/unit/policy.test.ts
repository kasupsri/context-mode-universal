import { describe, it, expect } from 'vitest';
import {
  evaluateCommand,
  evaluateFilePath,
  extractShellCommands,
  splitChainedCommands,
} from '../../src/security/policy.js';

describe('policy splitChainedCommands', () => {
  it('splits chained shell commands', () => {
    const parts = splitChainedCommands('echo ok && Remove-Item -Recurse -Force C:\\temp ; dir');
    expect(parts.length).toBe(3);
    expect(parts[1]).toContain('Remove-Item');
  });
});

describe('policy evaluateCommand', () => {
  it('denies destructive strict command', () => {
    const decision = evaluateCommand('Remove-Item -Recurse -Force C:\\temp\\x');
    expect(decision.decision).toBe('deny');
  });

  it('allows normal read-only command', () => {
    const decision = evaluateCommand('Get-ChildItem .');
    expect(['allow', 'ask']).toContain(decision.decision);
  });
});

describe('policy evaluateFilePath', () => {
  it('denies .env paths', () => {
    const evalResult = evaluateFilePath('C:\\repo\\.env');
    expect(evalResult.denied).toBe(true);
  });
});

describe('policy extractShellCommands', () => {
  it('finds embedded shell exec in JavaScript', () => {
    const cmds = extractShellCommands('execSync("del /s /q C:\\\\tmp\\\\*")', 'javascript');
    expect(cmds.length).toBeGreaterThan(0);
    expect(cmds[0]).toContain('del /s /q');
  });
});

