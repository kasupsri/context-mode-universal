import { describe, expect, it } from 'vitest';
import { optimizeResponse } from '../../src/compression/response-optimizer.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';

function minValidTokens(result: ReturnType<typeof optimizeResponse>): number {
  const valid = result.candidates.filter(candidate => candidate.valid);
  if (valid.length === 0) return result.outputTokens;
  return Math.min(...valid.map(candidate => candidate.outputTokens));
}

describe('optimizeResponse', () => {
  it('selects the globally minimum-token valid candidate', () => {
    const text = Array.from({ length: 250 }, (_, i) => `Line ${i}: value ${i * 3}`).join('\n');
    const result = optimizeResponse(text, {
      maxOutputTokens: 120,
      intent: 'errors and warnings',
      preferredStrategy: 'summarize',
      toolName: 'execute',
    });

    expect(result.outputTokens).toBe(minValidTokens(result));
  });

  it('enforces output budget', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz'.repeat(200);
    const result = optimizeResponse(text, { maxOutputTokens: 40, toolName: 'search' });

    expect(result.output.length).toBeLessThanOrEqual(120);
    expect(result.budgetForced).toBe(true);
  });

  it('uses deterministic tie-breaking', () => {
    const text = 'hello world';
    const first = optimizeResponse(text, { maxOutputTokens: 100, toolName: 'compress' });
    const second = optimizeResponse(text, { maxOutputTokens: 100, toolName: 'compress' });

    expect(first.output).toBe(second.output);
    expect(first.chosenStrategy).toBe(second.chosenStrategy);
  });

  it('retains at least one error marker when possible', () => {
    const text = 'Error: command failed\nSTDERR:\nconnection refused\n[Exit code: 1]';
    const result = optimizeResponse(text, {
      maxOutputTokens: 4,
      toolName: 'execute',
      isError: true,
    });

    expect(result.output.length).toBeLessThanOrEqual(12);
    expect(/error|stderr|exit code|timeout/i.test(result.output)).toBe(true);
  });

  it('applies default token budget when maxOutputTokens is omitted', () => {
    const text = 'x'.repeat(10000);
    const result = optimizeResponse(text, { toolName: 'execute' });

    expect(result.budgetTokens).toBe(DEFAULT_CONFIG.compression.defaultMaxOutputTokens);
    expect(result.outputTokens).toBeLessThanOrEqual(result.budgetTokens);
  });

  it('enforces hard max token cap when request exceeds limit', () => {
    const text = 'x'.repeat(20000);
    const result = optimizeResponse(text, {
      toolName: 'execute',
      maxOutputTokens: DEFAULT_CONFIG.compression.hardMaxOutputTokens + 500,
    });

    expect(result.budgetTokens).toBe(DEFAULT_CONFIG.compression.hardMaxOutputTokens);
    expect(result.outputTokens).toBeLessThanOrEqual(result.budgetTokens);
  });
});
