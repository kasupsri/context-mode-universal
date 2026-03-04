import { describe, it, expect } from 'vitest';
import {
  getRuntimeForLanguage,
  resolveShellRuntime,
  isShellLanguage,
} from '../../src/sandbox/runtimes.js';

describe('runtimes', () => {
  it('resolves javascript runtime', () => {
    const rt = getRuntimeForLanguage('javascript');
    expect(rt).toBeDefined();
    expect(rt?.command).toBeTruthy();
  });

  it('detects shell language aliases', () => {
    expect(isShellLanguage('shell')).toBe(true);
    expect(isShellLanguage('powershell')).toBe(true);
    expect(isShellLanguage('cmd')).toBe(true);
    expect(isShellLanguage('javascript')).toBe(false);
  });

  it('resolves preferred shell runtime with fallback', () => {
    const rt = resolveShellRuntime('shell', 'powershell');
    expect(rt).toBeDefined();
    expect(rt?.runtimeId).toBeTruthy();
  });
});
