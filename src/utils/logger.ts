export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env['LOG_LEVEL'] as LogLevel) ?? 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[currentLevel];
}

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      process.stderr.write(formatMessage('debug', message, data) + '\n');
    }
  },
  info(message: string, data?: unknown): void {
    if (shouldLog('info')) {
      process.stderr.write(formatMessage('info', message, data) + '\n');
    }
  },
  warn(message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      process.stderr.write(formatMessage('warn', message, data) + '\n');
    }
  },
  error(message: string, data?: unknown): void {
    if (shouldLog('error')) {
      process.stderr.write(formatMessage('error', message, data) + '\n');
    }
  },
};
