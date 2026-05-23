import { describe, it, expect } from 'vitest';
import { reduceToSignals } from '../../src/signals/reduce.js';
import type { AllCollectorResults } from '../../src/collectors/index.js';

function makeRaw(overrides: Partial<AllCollectorResults> = {}): AllCollectorResults {
  return {
    npm: {
      source: 'npm',
      ok: true,
      durationMs: 10,
      data: {
        name: 'test-pkg',
        description: 'A test package',
        license: 'MIT',
        repository: 'https://github.com/test/test-pkg',
        latestVersion: '1.2.3',
        lastPublishDate: '2024-01-01T00:00:00Z',
        maintainers: ['alice', 'bob'],
        dependencies: { lodash: '^4.0.0' },
        deprecated: false,
      },
    },
    npmDownloads: {
      source: 'npmDownloads',
      ok: true,
      durationMs: 10,
      data: { weeklyDownloads: 50000, monthlyDownloads: 200000 },
    },
    github: {
      source: 'github',
      ok: true,
      durationMs: 10,
      data: {
        stars: 1200,
        openIssues: 23,
        lastCommitDate: '2024-01-10T00:00:00Z',
        archived: false,
        defaultBranch: 'main',
        recentIssueTitles: ['Bug: crash on null', 'Feature: add timeout'],
        readmeSnippet: '# test-pkg\nA great package.',
      },
    },
    bundlephobia: {
      source: 'bundlephobia',
      ok: true,
      durationMs: 10,
      data: { minified: 10000, minifiedGzipped: 3500, dependencyCount: 1, hasTreeshaking: true },
    },
    osv: {
      source: 'osv',
      ok: true,
      durationMs: 10,
      data: {
        vulnerabilities: [
          { id: 'GHSA-test', severity: 'high', summary: 'Test vuln' },
        ],
      },
    },
    depsdev: {
      source: 'depsdev',
      ok: true,
      durationMs: 10,
      data: { scorecardScore: 8.5 },
    },
    ...overrides,
  };
}

describe('reduceToSignals', () => {
  it('maps package fields correctly', () => {
    const signals = reduceToSignals(makeRaw());
    expect(signals.package.name).toBe('test-pkg');
    expect(signals.package.version).toBe('1.2.3');
    expect(signals.package.license).toBe('MIT');
  });

  it('computes maintainerCount', () => {
    const signals = reduceToSignals(makeRaw());
    expect(signals.health.maintainerCount).toBe(2);
  });

  it('counts direct dependencies', () => {
    const signals = reduceToSignals(makeRaw());
    expect(signals.size.dependencyCount).toBe(1);
  });

  it('passes through vulnerabilities', () => {
    const signals = reduceToSignals(makeRaw());
    expect(signals.health.knownVulnerabilities).toHaveLength(1);
    expect(signals.health.knownVulnerabilities[0]?.severity).toBe('high');
  });

  it('tracks failed collectors in meta', () => {
    const raw = makeRaw({
      bundlephobia: { source: 'bundlephobia', ok: false, error: 'timeout', durationMs: 5000 },
      github: { source: 'github', ok: false, error: 'not found', durationMs: 100 },
    });
    const signals = reduceToSignals(raw);
    expect(signals.meta.collectorsFailed).toContain('bundlephobia');
    expect(signals.meta.collectorsFailed).toContain('github');
    expect(signals.meta.collectorsFailed).not.toContain('npm');
  });

  it('classifies cadence as dormant for old publish date', () => {
    const raw = makeRaw({
      npm: {
        source: 'npm', ok: true, durationMs: 10,
        data: {
          name: 'old-pkg', description: null, license: null, repository: null,
          latestVersion: '0.1.0', lastPublishDate: '2019-01-01T00:00:00Z',
          maintainers: ['solo'], dependencies: {}, deprecated: false,
        },
      },
    });
    const signals = reduceToSignals(raw);
    expect(signals.activity.releaseCadence).toBe('dormant');
  });

  it('sets deprecatedFlag from npm deprecated field', () => {
    const raw = makeRaw({
      npm: {
        source: 'npm', ok: true, durationMs: 10,
        data: {
          name: 'old-pkg', description: null, license: null, repository: null,
          latestVersion: '1.0.0', lastPublishDate: new Date().toISOString(),
          maintainers: ['solo'], dependencies: {},
          deprecated: 'Use new-pkg instead',
        },
      },
    });
    const signals = reduceToSignals(raw);
    expect(signals.qualitative.deprecatedFlag).toBe(true);
  });
});
