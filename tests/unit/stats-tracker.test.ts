import { describe, it, expect } from 'vitest';
import { statsTracker } from '../../src/utils/stats-tracker.js';

describe('statsTracker', () => {
  it('records events and computes totals', () => {
    statsTracker.reset();
    statsTracker.record('compress', 'x'.repeat(6000), 'x'.repeat(1000), 'truncate');
    statsTracker.record('execute', 'y'.repeat(8000), 'y'.repeat(1200), 'summarize');

    const stats = statsTracker.getSessionStats();
    expect(stats.totalEvents).toBe(2);
    expect(stats.bytesSaved).toBeGreaterThan(0);
    expect(stats.tokensSaved).toBeGreaterThan(0);
    expect(stats.byTool.length).toBeGreaterThan(0);
  });

  it('formats a readable session summary', () => {
    const text = statsTracker.formatSessionStatsText();
    expect(text).toContain('Session Stats');
    expect(text).toContain('Saved:');
  });
});

