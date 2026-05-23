import type { AllCollectorResults } from '../collectors/index.js';
import type { Signals } from './types.js';

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / 86_400_000);
}

function releaseCadence(daysSincePublish: number): Signals['activity']['releaseCadence'] {
  if (daysSincePublish <= 90) return 'active';
  if (daysSincePublish <= 365) return 'slow';
  if (daysSincePublish <= 730) return 'dormant';
  return 'dormant';
}

export function reduceToSignals(raw: AllCollectorResults): Signals {
  const failed: string[] = [];
  if (!raw.npm.ok) failed.push('npm');
  if (!raw.npmDownloads.ok) failed.push('npmDownloads');
  if (!raw.github.ok) failed.push('github');
  if (!raw.bundlephobia.ok) failed.push('bundlephobia');
  if (!raw.osv.ok) failed.push('osv');
  if (!raw.depsdev.ok) failed.push('depsdev');

  const npm = raw.npm.data;
  const dl = raw.npmDownloads.data;
  const gh = raw.github.data;
  const bp = raw.bundlephobia.data;
  const osv = raw.osv.data;
  const dd = raw.depsdev.data;

  const lastPublishDate = npm?.lastPublishDate ?? new Date().toISOString();
  const daysSincePublish = daysSince(lastPublishDate) ?? 0;

  return {
    package: {
      name: npm?.name ?? 'unknown',
      version: npm?.latestVersion ?? 'unknown',
      license: npm?.license ?? null,
      description: npm?.description ?? null,
      repository: npm?.repository ?? null,
    },
    activity: {
      lastPublishDate,
      daysSinceLastPublish: daysSincePublish,
      lastCommitDate: gh?.lastCommitDate ?? null,
      daysSinceLastCommit: daysSince(gh?.lastCommitDate),
      archived: gh?.archived ?? false,
      releaseCadence: releaseCadence(daysSincePublish),
    },
    popularity: {
      weeklyDownloads: dl?.weeklyDownloads ?? 0,
      githubStars: gh?.stars ?? null,
      dependentsCount: null, // not yet sourced
    },
    health: {
      openIssues: gh?.openIssues ?? null,
      openIssuesAgeMedianDays: null, // not yet sourced
      knownVulnerabilities: osv?.vulnerabilities ?? [],
      maintainerCount: npm?.maintainers.length ?? 0,
    },
    size: {
      minified: bp?.minified ?? null,
      minifiedGzipped: bp?.minifiedGzipped ?? null,
      hasTreeshaking: bp?.hasTreeshaking ?? null,
      dependencyCount: Object.keys(npm?.dependencies ?? {}).length,
    },
    qualitative: {
      readmeSnippet: gh?.readmeSnippet ?? null,
      recentIssueTitles: gh?.recentIssueTitles ?? [],
      deprecatedFlag: Boolean(npm?.deprecated),
      scorecardScore: dd?.scorecardScore ?? null,
    },
    meta: {
      collectorsFailed: failed,
      collectedAt: new Date().toISOString(),
    },
  };
}
