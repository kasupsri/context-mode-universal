import { chunkMarkdown } from '../compression/chunker.js';
import { SqliteStore } from './sqlite-store.js';
import { logger } from '../utils/logger.js';

export interface IndexOptions {
  kbName?: string;
  source?: string;
  chunkSize?: number;
}

export interface IndexResult {
  chunksIndexed: number;
  source: string;
  kbName: string;
}

export class Indexer {
  constructor(private store: SqliteStore) {}

  async indexText(text: string, options: IndexOptions = {}): Promise<IndexResult> {
    const kbName = options.kbName ?? 'default';
    const source = options.source ?? 'inline';
    const chunkSize = options.chunkSize ?? 1500;

    const chunks = chunkMarkdown(text, chunkSize);

    // Filter out empty chunks
    const validChunks = chunks.filter(c => c.content.trim().length > 20);

    const count = await this.store.insertChunks(
      validChunks.map(c => ({ content: c.content, heading: c.heading })),
      source,
      kbName
    );

    logger.info('Indexed content', { source, kbName, chunks: count });

    return { chunksIndexed: count, source, kbName };
  }

  async indexUrl(url: string, markdown: string, options: IndexOptions = {}): Promise<IndexResult> {
    return this.indexText(markdown, {
      ...options,
      source: url,
    });
  }
}
