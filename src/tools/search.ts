import { Searcher } from '../knowledge-base/searcher.js';
import { getStore } from './index-content.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';

export interface SearchToolInput {
  query: string;
  kb_name?: string;
  top_k?: number;
  max_output_tokens?: number;
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

  return searcher.formatResults(response);
}
