import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import { loadConfigFromEnv, parseConfig } from '../../src/config/schema.js';

const ENV_KEYS = [
  'WCM_TIMEOUT_MS',
  'WCM_MAX_FILE_BYTES',
  'WCM_ALLOW_AUTH_PASSTHROUGH',
  'WCM_MAX_FETCH_BYTES',
  'LOG_LEVEL',
] as const;

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

describe('config schema', () => {
  it('parses validated environment values', () => {
    process.env['WCM_TIMEOUT_MS'] = '45000';
    process.env['WCM_MAX_FILE_BYTES'] = '2048';
    process.env['WCM_ALLOW_AUTH_PASSTHROUGH'] = 'true';
    process.env['WCM_MAX_FETCH_BYTES'] = '1048576';
    process.env['LOG_LEVEL'] = 'warn';

    const cfg = loadConfigFromEnv();

    expect(cfg.sandbox?.timeoutMs).toBe(45000);
    expect(cfg.sandbox?.maxFileBytes).toBe(2048);
    expect(cfg.sandbox?.allowAuthPassthrough).toBe(true);
    expect(cfg.knowledgeBase?.maxFetchBytes).toBe(1048576);
    expect(cfg.logging?.level).toBe('warn');
  });

  it('ignores invalid numeric and enum values', () => {
    process.env['WCM_TIMEOUT_MS'] = '-5';
    process.env['WCM_MAX_FILE_BYTES'] = 'not-a-number';
    process.env['LOG_LEVEL'] = 'verbose';

    const cfg = loadConfigFromEnv();

    expect(cfg.sandbox?.timeoutMs).toBeUndefined();
    expect(cfg.sandbox?.maxFileBytes).toBeUndefined();
    expect(cfg.logging).toBeUndefined();
  });

  it('returns a cloned default config for invalid input', () => {
    const parsed = parseConfig(undefined);
    const originalTimeout = DEFAULT_CONFIG.sandbox.timeoutMs;

    expect(parsed).toEqual(DEFAULT_CONFIG);
    parsed.sandbox.timeoutMs = originalTimeout + 1;
    expect(DEFAULT_CONFIG.sandbox.timeoutMs).toBe(originalTimeout);
  });
});
