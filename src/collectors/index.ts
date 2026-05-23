import { collectNpm } from './npm.js';
import { collectNpmDownloads } from './npmDownloads.js';
import { collectGithub } from './github.js';
import { collectBundlephobia } from './bundlephobia.js';
import { collectOsv } from './osv.js';
import { collectDepsDev } from './depsdev.js';
import type {
  CollectorResult,
  NpmData,
  NpmDownloadsData,
  GithubData,
  BundlephobiaData,
  OsvData,
  DepsDevData,
} from './types.js';

export interface AllCollectorResults {
  npm: CollectorResult<NpmData>;
  npmDownloads: CollectorResult<NpmDownloadsData>;
  github: CollectorResult<GithubData>;
  bundlephobia: CollectorResult<BundlephobiaData>;
  osv: CollectorResult<OsvData>;
  depsdev: CollectorResult<DepsDevData>;
}

export async function collectAll(pkg: string): Promise<AllCollectorResults> {
  // Run npm first to get the repo URL for github
  const npm = await collectNpm(pkg);
  const repoUrl = npm.data?.repository ?? null;

  const [npmDownloads, github, bundlephobia, osv, depsdev] = await Promise.all([
    collectNpmDownloads(pkg),
    collectGithub(repoUrl),
    collectBundlephobia(pkg),
    collectOsv(pkg),
    collectDepsDev(pkg),
  ]);

  return { npm, npmDownloads, github, bundlephobia, osv, depsdev };
}
