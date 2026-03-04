#!/usr/bin/env node
/**
 * windows-context-mode — MCP server entry point
 *
 * Windows-first MCP server for safe execution and context compression.
 */

import { createServer } from './server.js';
import { logger } from './utils/logger.js';
import { loadConfigFromEnv, parseConfig } from './config/schema.js';
import { DEFAULT_CONFIG } from './config/defaults.js';
import { runSetup } from './adapters/generic.js';
import { doctorTool } from './tools/doctor.js';

const args = process.argv.slice(2);

// Handle setup command
if (args[0] === 'setup') {
  const ide = args[1] as string | undefined;
  runSetup(ide).catch(err => {
    logger.error('Setup failed', err);
    process.exit(1);
  });
} else if (args[0] === 'doctor') {
  const merged = parseConfig(loadConfigFromEnv());
  Object.assign(DEFAULT_CONFIG.compression, merged.compression);
  Object.assign(DEFAULT_CONFIG.sandbox, merged.sandbox);
  Object.assign(DEFAULT_CONFIG.security, merged.security);
  Object.assign(DEFAULT_CONFIG.knowledgeBase, merged.knowledgeBase);
  Object.assign(DEFAULT_CONFIG.logging, merged.logging);
  Object.assign(DEFAULT_CONFIG.stats, merged.stats);
  // eslint-disable-next-line no-console
  console.log(doctorTool());
} else {
  // Start MCP server
  startServer().catch(err => {
    logger.error('Server failed to start', err);
    process.exit(1);
  });
}

async function startServer() {
  const merged = parseConfig(loadConfigFromEnv());
  Object.assign(DEFAULT_CONFIG.compression, merged.compression);
  Object.assign(DEFAULT_CONFIG.sandbox, merged.sandbox);
  Object.assign(DEFAULT_CONFIG.security, merged.security);
  Object.assign(DEFAULT_CONFIG.knowledgeBase, merged.knowledgeBase);
  Object.assign(DEFAULT_CONFIG.logging, merged.logging);
  Object.assign(DEFAULT_CONFIG.stats, merged.stats);

  logger.info('Starting windows-context-mode MCP server', { pid: process.pid });

  const { server, transport } = createServer();

  await server.connect(transport);

  logger.info('MCP server connected via stdio');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}
