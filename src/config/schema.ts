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
    security: {
      ...DEFAULT_CONFIG.security,
      ...(partial.security ?? {}),
    },
    knowledgeBase: {
      ...DEFAULT_CONFIG.knowledgeBase,
      ...(partial.knowledgeBase ?? {}),
    },
    logging: {
      ...DEFAULT_CONFIG.logging,
      ...(partial.logging ?? {}),
    },
    stats: {
      ...DEFAULT_CONFIG.stats,
      ...(partial.stats ?? {}),
    },
  };
}

export function loadConfigFromEnv(): DeepPartial<ContextModeConfig> {
  const config: DeepPartial<ContextModeConfig> = {};

  if (process.env['WCM_THRESHOLD_BYTES']) {
    config.compression = config.compression ?? {};
    config.compression.thresholdBytes = parseInt(process.env['WCM_THRESHOLD_BYTES'], 10);
  }

  if (process.env['WCM_MAX_OUTPUT_BYTES']) {
    config.compression = config.compression ?? {};
    config.compression.maxOutputBytes = parseInt(process.env['WCM_MAX_OUTPUT_BYTES'], 10);
  }

  if (process.env['WCM_TIMEOUT_MS']) {
    config.sandbox = config.sandbox ?? {};
    config.sandbox.timeoutMs = parseInt(process.env['WCM_TIMEOUT_MS'], 10);
  }

  if (process.env['WCM_SHELL']) {
    config.sandbox = config.sandbox ?? {};
    const shell = process.env['WCM_SHELL'];
    if (shell === 'powershell' || shell === 'cmd' || shell === 'git-bash') {
      config.sandbox.shellDefault = shell;
    }
  }

  if (process.env['WCM_POLICY_MODE']) {
    config.security = config.security ?? {};
    const mode = process.env['WCM_POLICY_MODE'];
    if (mode === 'strict' || mode === 'balanced' || mode === 'permissive') {
      config.security.policyMode = mode;
    }
  }

  if (process.env['WCM_DB_PATH']) {
    config.knowledgeBase = config.knowledgeBase ?? {};
    config.knowledgeBase.dbPath = process.env['WCM_DB_PATH'];
  }

  if (process.env['WCM_STATS_FOOTER']) {
    config.stats = config.stats ?? {};
    config.stats.footerEnabled =
      process.env['WCM_STATS_FOOTER'].toLowerCase() !== 'false';
  }

  if (process.env['WCM_STATS_EXPORT_PATH']) {
    config.stats = config.stats ?? {};
    config.stats.exportPath = process.env['WCM_STATS_EXPORT_PATH'];
  }

  if (process.env['LOG_LEVEL']) {
    config.logging = { level: process.env['LOG_LEVEL'] as ContextModeConfig['logging']['level'] };
  }

  return config;
}
