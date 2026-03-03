import { Searcher } from '../knowledge-base/searcher.js';
import { getStore } from './index-content.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';

export interface SearchToolInput {
  query: string;
  kb_name?: string;
  top_k?: number;
}

export async function searchTool(input: SearchToolInput): Promise<string> {
  const store = getStore();
  const searcher = new Searcher(store);

  const response = await searcher.search(input.query, {
    kbName: input.kb_name ?? 'default',
    topK: input.top_k ?? DEFAULT_CONFIG.knowledgeBase.searchTopK,
  });

  return searcher.formatResults(response);
}
