import { statsTracker } from '../utils/stats-tracker.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { type ResponseMode } from '../config/defaults.js';

export interface StatsResetToolInput {
  max_output_tokens?: number;
  response_mode?: ResponseMode;
}

export function statsResetTool(input: StatsResetToolInput = {}): string {
  statsTracker.reset();
  const responseMode = input.response_mode ?? DEFAULT_CONFIG.compression.responseMode;
  return responseMode === 'full' ? 'Session compression statistics reset.' : 'ok:stats_reset';
}
