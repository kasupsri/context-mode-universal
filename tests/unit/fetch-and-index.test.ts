import { describe, expect, it } from 'vitest';
import { fetchAndIndexTool } from '../../src/tools/fetch-and-index.js';

describe('fetchAndIndexTool safety', () => {
  it('rejects unsupported URL protocols', async () => {
    const result = await fetchAndIndexTool({ url: 'file:///etc/passwd' });
    expect(result).toContain('Unsupported URL protocol');
  });

  it('rejects localhost/private targets by default', async () => {
    const result = await fetchAndIndexTool({ url: 'http://localhost:8080' });
    expect(result).toContain('Refusing to fetch local/private host');
  });
});
