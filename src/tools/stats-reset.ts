import { statsTracker } from '../utils/stats-tracker.js';

export function statsResetTool(): string {
  statsTracker.reset();
  return 'Session compression statistics reset.';
}
