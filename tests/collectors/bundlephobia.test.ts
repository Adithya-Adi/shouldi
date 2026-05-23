import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = join(fileURLToPath(import.meta.url), '../../fixtures');

vi.mock('../../src/lib/cache.js', () => ({
  cacheGet: () => null,
  cacheSet: () => {},
}));

const globalFetch = vi.fn();
vi.stubGlobal('fetch', globalFetch);

function fixture(name: string) {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf8')) as unknown;
}

function mockFetch(data: unknown, status = 200) {
  globalFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(data),
  });
}

describe('collectBundlephobia', () => {
  beforeEach(() => globalFetch.mockReset());

  it('parses bundle size data for lodash', async () => {
    mockFetch(fixture('bundlephobia-lodash.json'));
    const { collectBundlephobia } = await import('../../src/collectors/bundlephobia.js');
    const result = await collectBundlephobia('lodash');

    expect(result.ok).toBe(true);
    expect(result.data?.minified).toBe(531310);
    expect(result.data?.minifiedGzipped).toBe(72429);
    expect(result.data?.dependencyCount).toBe(0);
    expect(result.data?.hasTreeshaking).toBe(false);
  });
});
