import { DEFAULT_CONFIG } from '../config/defaults.js';
import { statsTracker } from '../utils/stats-tracker.js';

export interface StatsExportInput {
  path?: string;
}

export async function statsExportTool(input: StatsExportInput): Promise<string> {
  const path = await statsTracker.exportToFile(input.path ?? DEFAULT_CONFIG.stats.exportPath);
  return `Session stats exported to: ${path}`;
}
