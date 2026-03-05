import { Indexer } from '../knowledge-base/indexer.js';
import { SqliteStore } from '../knowledge-base/sqlite-store.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { type ResponseMode } from '../config/defaults.js';

// Shared store instance (singleton per process)
let sharedStore: SqliteStore | null = null;

export function getStore(): SqliteStore {
  if (!sharedStore) {
    sharedStore = new SqliteStore(DEFAULT_CONFIG.knowledgeBase.dbPath);
  }
  return sharedStore;
}

export interface IndexContentToolInput {
  content: string;
  source?: string;
  kb_name?: string;
  chunk_size?: number;
  max_output_tokens?: number;
  response_mode?: ResponseMode;
}

export async function indexContentTool(input: IndexContentToolInput): Promise<string> {
  const store = getStore();
  const indexer = new Indexer(store);
  const chunkSize =
    typeof input.chunk_size === 'number' &&
    Number.isFinite(input.chunk_size) &&
    input.chunk_size > 0
      ? Math.floor(input.chunk_size)
      : DEFAULT_CONFIG.knowledgeBase.maxChunkSize;

  const result = await indexer.indexText(input.content, {
    source: input.source ?? 'inline',
    kbName: input.kb_name ?? 'default',
    chunkSize,
  });

  const stats = await store.getStats(result.kbName);

  const responseMode = input.response_mode ?? DEFAULT_CONFIG.compression.responseMode;
  if (responseMode === 'full') {
    return [
      `Indexed ${result.chunksIndexed} chunk(s) from "${result.source}".`,
      `Knowledge base "${result.kbName}": ${stats.chunkCount} total chunks from ${stats.sources} source(s).`,
      `Use the search tool to query this content.`,
    ].join('\n');
  }

  return `ok:index chunks=${result.chunksIndexed} kb=${result.kbName} total=${stats.chunkCount} srcs=${stats.sources} src=${result.source}`;
}
