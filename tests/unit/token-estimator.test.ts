import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  estimateTokensForMessages,
  tokensToChars,
  formatTokenCount,
} from '../../src/utils/token-estimator.js';

describe('estimateTokens', () => {
  it('estimates tokens for plain English text', () => {
    const text = 'The quick brown fox jumps over the lazy dog.';
    const result = estimateTokens(text);
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.characters).toBe(text.length);
    // Should be roughly 9-11 tokens for this sentence
    expect(result.tokens).toBeGreaterThan(5);
    expect(result.tokens).toBeLessThan(20);
  });

  it('estimates fewer chars per token for code (denser)', () => {
    const code = `function add(a: number, b: number): number { return a + b; }`;
    const text = `The function adds two numbers together and returns the result.`;
    const codeResult = estimateTokens(code);
    const textResult = estimateTokens(text);
    // Code should use lower chars/token ratio
    expect(codeResult.ratio).toBeLessThanOrEqual(textResult.ratio);
  });

  it('handles empty string', () => {
    const result = estimateTokens('');
    expect(result.tokens).toBe(0);
    expect(result.characters).toBe(0);
  });

  it('handles very long text', () => {
    const text = 'word '.repeat(10000);
    const result = estimateTokens(text);
    expect(result.tokens).toBeGreaterThan(1000);
  });
});

describe('estimateTokensForMessages', () => {
  it('sums token estimates across messages', () => {
    const messages = ['Hello world', 'This is a test message', 'Another line'];
    const total = estimateTokensForMessages(messages);
    expect(total).toBeGreaterThan(0);

    // Should equal sum of individual estimates
    const sum = messages.reduce((s, m) => s + estimateTokens(m).tokens, 0);
    expect(total).toBe(sum);
  });

  it('returns 0 for empty messages array', () => {
    expect(estimateTokensForMessages([])).toBe(0);
  });
});

describe('tokensToChars', () => {
  it('converts tokens to characters (prose)', () => {
    const chars = tokensToChars(100, false);
    expect(chars).toBe(400); // 4 chars per token
  });

  it('converts tokens to characters (code)', () => {
    const chars = tokensToChars(100, true);
    expect(chars).toBe(300); // 3 chars per token
  });
});

describe('formatTokenCount', () => {
  it('formats small counts as integers', () => {
    expect(formatTokenCount(500)).toBe('500 tokens');
  });

  it('formats large counts in K notation', () => {
    expect(formatTokenCount(1500)).toBe('1.5K tokens');
    expect(formatTokenCount(10000)).toBe('10.0K tokens');
  });
});
