import { DEFAULT_CONFIG, type ContextModeConfig } from './defaults.js';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function parseConfig(input: unknown): ContextModeConfig {
  if (!input || typeof input !== 'object') {
    return DEFAULT_CONFIG;
  }

  const partial = input as DeepPartial<ContextModeConfig>;

  return {
    compression: {
      ...DEFAULT_CONFIG.compression,
      ...(partial.compression ?? {}),
    },
    sandbox: {
      ...DEFAULT_CONFIG.sandbox,
      ...(partial.sandbox ?? {}),
    },
    knowledgeBase: {
      ...DEFAULT_CONFIG.knowledgeBase,
      ...(partial.knowledgeBase ?? {}),
    },
    logging: {
      ...DEFAULT_CONFIG.logging,
      ...(partial.logging ?? {}),
    },
  };
}

export function loadConfigFromEnv(): DeepPartial<ContextModeConfig> {
  const config: DeepPartial<ContextModeConfig> = {};

  if (process.env['UCM_THRESHOLD_BYTES']) {
    config.compression = config.compression ?? {};
    config.compression.thresholdBytes = parseInt(process.env['UCM_THRESHOLD_BYTES'], 10);
  }

  if (process.env['UCM_MAX_OUTPUT_BYTES']) {
    config.compression = config.compression ?? {};
    config.compression.maxOutputBytes = parseInt(process.env['UCM_MAX_OUTPUT_BYTES'], 10);
  }

  if (process.env['UCM_TIMEOUT_MS']) {
    config.sandbox = config.sandbox ?? {};
    config.sandbox.timeoutMs = parseInt(process.env['UCM_TIMEOUT_MS'], 10);
  }

  if (process.env['UCM_DB_PATH']) {
    config.knowledgeBase = config.knowledgeBase ?? {};
    config.knowledgeBase.dbPath = process.env['UCM_DB_PATH'];
  }

  if (process.env['LOG_LEVEL']) {
    config.logging = { level: process.env['LOG_LEVEL'] as ContextModeConfig['logging']['level'] };
  }

  return config;
}
