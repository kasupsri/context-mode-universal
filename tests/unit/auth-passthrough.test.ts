import { afterEach, describe, expect, it } from 'vitest';
import { buildSandboxEnv } from '../../src/sandbox/auth-passthrough.js';

const ENV_KEYS = ['GITHUB_TOKEN', 'AWS_ACCESS_KEY_ID'] as const;

const originalEnv: Record<string, string | undefined> = Object.fromEntries(
  ENV_KEYS.map(key => [key, process.env[key]])
);

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe('buildSandboxEnv', () => {
  it('does not expose auth credentials by default', () => {
    process.env['GITHUB_TOKEN'] = 'secret-gh-token';
    process.env['AWS_ACCESS_KEY_ID'] = 'secret-aws-key';

    const env = buildSandboxEnv();

    expect(env['GITHUB_TOKEN']).toBeUndefined();
    expect(env['AWS_ACCESS_KEY_ID']).toBeUndefined();
  });

  it('allows auth passthrough when explicitly enabled', () => {
    process.env['GITHUB_TOKEN'] = 'secret-gh-token';

    const env = buildSandboxEnv(undefined, true);

    expect(env['GITHUB_TOKEN']).toBe('secret-gh-token');
  });
});
