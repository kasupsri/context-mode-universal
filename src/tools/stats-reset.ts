import { statsTracker } from '../utils/stats-tracker.js';

export interface StatsResetToolInput {
  max_output_tokens?: number;
}

export function statsResetTool(_input: StatsResetToolInput = {}): string {
  statsTracker.reset();
  return 'Session compression statistics reset.';
}
