import { statsTracker } from '../utils/stats-tracker.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { type ResponseMode } from '../config/defaults.js';

export interface StatsGetToolInput {
  max_output_tokens?: number;
  response_mode?: ResponseMode;
}

export function statsGetTool(input: StatsGetToolInput = {}): string {
  const responseMode = input.response_mode ?? DEFAULT_CONFIG.compression.responseMode;
  return responseMode === 'full'
    ? statsTracker.formatSessionStatsText()
    : statsTracker.formatSessionStatsMinimal();
}
