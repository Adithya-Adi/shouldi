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

describe('collectOsv', () => {
  beforeEach(() => globalFetch.mockReset());

  it('returns empty vulns for clean package', async () => {
    mockFetch(fixture('osv-lodash.json'));
    const { collectOsv } = await import('../../src/collectors/osv.js');
    const result = await collectOsv('lodash');

    expect(result.ok).toBe(true);
    expect(result.data?.vulnerabilities).toHaveLength(0);
  });

  it('normalizes severity from database_specific', async () => {
    mockFetch(fixture('osv-with-vulns.json'));
    const { collectOsv } = await import('../../src/collectors/osv.js');
    const result = await collectOsv('vulnerable-pkg');

    expect(result.ok).toBe(true);
    const vulns = result.data?.vulnerabilities ?? [];
    expect(vulns).toHaveLength(2);
    // First vuln: database_specific.severity = HIGH → high
    expect(vulns[0]?.severity).toBe('high');
    expect(vulns[0]?.id).toBe('GHSA-xxxx-yyyy-zzzz');
    // Second vuln: database_specific.severity = low → low
    expect(vulns[1]?.severity).toBe('low');
  });
});
