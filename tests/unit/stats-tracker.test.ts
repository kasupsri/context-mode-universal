import { describe, it, expect } from 'vitest';
import { statsTracker } from '../../src/utils/stats-tracker.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';

describe('statsTracker', () => {
  it('records events and computes totals', () => {
    statsTracker.reset();
    statsTracker.record('compress', 'x'.repeat(6000), 'x'.repeat(1000), 'truncate');
    statsTracker.record('execute', 'y'.repeat(8000), 'y'.repeat(1200), 'summarize');

    const stats = statsTracker.getSessionStats();
    expect(stats.totalEvents).toBe(2);
    expect(stats.responsesProcessed).toBe(2);
    expect(stats.responsesChanged).toBe(2);
    expect(stats.bytesSaved).toBeGreaterThan(0);
    expect(stats.tokensSaved).toBeGreaterThan(0);
    expect(stats.byTool.length).toBeGreaterThan(0);
  });

  it('formats a readable session summary', () => {
    const text = statsTracker.formatSessionStatsText();
    expect(text).toContain('Session Stats');
    expect(text).toContain('Responses processed');
    expect(text).toContain('Saved:');
  });

  it('allows negative savings and records optimization counters', () => {
    statsTracker.reset();
    statsTracker.record('search', 'abc', 'abc'.repeat(20), 'summarize', {
      changed: true,
      budgetForced: false,
      candidateCount: 4,
    });
    let stats = statsTracker.getSessionStats();
    expect(stats.bytesSaved).toBeLessThan(0);
    expect(stats.tokensSaved).toBeLessThan(0);

    statsTracker.record('search', 'x'.repeat(2000), 'x'.repeat(100), 'truncate', {
      changed: true,
      budgetForced: true,
      candidateCount: 5,
    });

    stats = statsTracker.getSessionStats();
    expect(stats.responsesProcessed).toBe(2);
    expect(stats.responsesChanged).toBe(2);
    expect(stats.budgetForced).toBe(1);
  });

  it('caps in-memory event history', () => {
    const originalMaxEvents = DEFAULT_CONFIG.stats.maxEvents;
    try {
      DEFAULT_CONFIG.stats.maxEvents = 3;
      statsTracker.reset();

      for (let i = 0; i < 10; i++) {
        statsTracker.record('compress', 'x'.repeat(6000), 'x'.repeat(1000), 'truncate');
      }

      const stats = statsTracker.getSessionStats();
      expect(stats.events.length).toBe(3);
      expect(stats.droppedEvents).toBe(7);
    } finally {
      DEFAULT_CONFIG.stats.maxEvents = originalMaxEvents;
    }
  });
});
