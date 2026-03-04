import { statsTracker } from '../utils/stats-tracker.js';

export function statsGetTool(): string {
  return statsTracker.formatSessionStatsText();
}
