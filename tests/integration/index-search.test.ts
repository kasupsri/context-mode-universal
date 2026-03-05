import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteStore } from '../../src/knowledge-base/sqlite-store.js';
import { Indexer } from '../../src/knowledge-base/indexer.js';
import { Searcher } from '../../src/knowledge-base/searcher.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

const ANGULAR_DOCS = `
# Angular Component Architecture

Angular applications are built using components. Each component consists of:
- TypeScript class with @Component decorator
- HTML template
- CSS styles

## Standalone Components

Angular 17+ supports standalone components without NgModule.

\`\`\`typescript
@Component({
  standalone: true,
  selector: 'app-root',
  template: '<h1>Hello</h1>',
})
export class AppComponent {}
\`\`\`

## Change Detection

Angular uses zone.js for change detection by default.
OnPush strategy improves performance for large component trees.

## Dependency Injection

Services are injected using the inject() function or constructor injection.

\`\`\`typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
}
\`\`\`

# Angular Routing

RouterModule provides navigation between views.

## Route Guards

CanActivate and CanDeactivate guards protect routes.

## Lazy Loading

Feature modules can be lazily loaded to reduce initial bundle size.
`;

describe('Index → Search integration', () => {
  let store: SqliteStore;
  let indexer: Indexer;
  let searcher: Searcher;
  const kbName = 'angular';

  beforeEach(async () => {
    const dbPath = join(tmpdir(), `ucm-integration-${randomBytes(8).toString('hex')}.db`);
    store = new SqliteStore(dbPath);
    indexer = new Indexer(store);
    searcher = new Searcher(store);

    await indexer.indexText(ANGULAR_DOCS, { source: 'angular-docs.md', kbName });
  });

  afterEach(() => {
    store.close();
  });

  it('finds standalone components', async () => {
    const response = await searcher.search('standalone components', { kbName });
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.results[0]!.snippet).toMatch(/standalone/i);
  });

  it('finds change detection content', async () => {
    const response = await searcher.search('OnPush change detection performance', { kbName });
    expect(response.results.length).toBeGreaterThan(0);
  });

  it('finds dependency injection', async () => {
    const response = await searcher.search('inject service dependency injection', { kbName });
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.results[0]!.snippet).toMatch(/inject|service|dependency/i);
  });

  it('finds routing features', async () => {
    const response = await searcher.search('lazy loading route guards', { kbName });
    expect(response.results.length).toBeGreaterThan(0);
  });

  it('returns relevant sections (heading context included)', async () => {
    const response = await searcher.search('routing navigation', { kbName });
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.results[0]!.source).toBe('angular-docs.md');
  });

  it('formats search results in compact mode by default', async () => {
    const response = await searcher.search('component architecture', { kbName });
    const formatted = searcher.formatResults(response);

    expect(formatted).toContain('search n=');
    expect(formatted).toContain('angular-docs.md');
  });

  it('respects topK limit', async () => {
    const response = await searcher.search('angular', { kbName, topK: 2 });
    expect(response.results.length).toBeLessThanOrEqual(2);
  });
});
