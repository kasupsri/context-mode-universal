import { statsTracker } from '../utils/stats-tracker.js';

export interface StatsGetToolInput {
  max_output_tokens?: number;
}

export function statsGetTool(_input: StatsGetToolInput = {}): string {
  return statsTracker.formatSessionStatsText();
}
