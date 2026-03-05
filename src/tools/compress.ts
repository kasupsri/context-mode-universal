import { type CompressionStrategy } from '../compression/strategies.js';

export interface CompressToolInput {
  content: string;
  intent?: string;
  strategy?: CompressionStrategy;
  max_output_tokens?: number;
}

export function compressTool(input: CompressToolInput): string {
  return input.content;
}
