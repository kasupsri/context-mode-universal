import { Searcher } from '../knowledge-base/searcher.js';
import { getStore } from './index-content.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { type ResponseMode } from '../config/defaults.js';

export interface SearchToolInput {
  query: string;
  kb_name?: string;
  top_k?: number;
  compact?: boolean;
  max_output_tokens?: number;
  response_mode?: ResponseMode;
}

export async function searchTool(input: SearchToolInput): Promise<string> {
  const store = getStore();
  const searcher = new Searcher(store);
  const topK =
    typeof input.top_k === 'number' && Number.isFinite(input.top_k) && input.top_k > 0
      ? Math.floor(input.top_k)
      : DEFAULT_CONFIG.knowledgeBase.searchTopK;

  const response = await searcher.search(input.query, {
    kbName: input.kb_name ?? 'default',
    topK,
  });

  const responseMode = input.response_mode ?? DEFAULT_CONFIG.compression.responseMode;
  const compactByBudget =
    typeof input.max_output_tokens === 'number' &&
    Number.isFinite(input.max_output_tokens) &&
    input.max_output_tokens > 0 &&
    input.max_output_tokens <= 500;
  const compact = input.compact ?? (responseMode === 'minimal' || compactByBudget);
  return searcher.formatResults(response, { compact });
}
