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
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  });
}

describe('collectNpm', () => {
  beforeEach(() => globalFetch.mockReset());

  it('extracts lodash metadata correctly', async () => {
    mockFetch(fixture('npm-lodash.json'));
    const { collectNpm } = await import('../../src/collectors/npm.js');
    const result = await collectNpm('lodash');

    expect(result.ok).toBe(true);
    expect(result.source).toBe('npm');
    expect(result.data?.name).toBe('lodash');
    expect(result.data?.latestVersion).toBe('4.17.21');
    expect(result.data?.license).toBe('MIT');
    expect(result.data?.maintainers).toContain('jdalton');
    expect(result.data?.deprecated).toBe(false);
    expect(result.data?.repository).toContain('github.com/lodash/lodash');
  });

  it('strips git+ and .git from repository URL', async () => {
    mockFetch(fixture('npm-moment.json'));
    const { collectNpm } = await import('../../src/collectors/npm.js');
    const result = await collectNpm('moment');

    expect(result.data?.repository).toBe('https://github.com/moment/moment');
  });

  it('returns ok:false on HTTP error', async () => {
    mockFetch({}, 404);
    const { collectNpm } = await import('../../src/collectors/npm.js');
    const result = await collectNpm('nonexistent-pkg-xyz');

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});
