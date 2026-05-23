import { httpGet } from '../lib/http.js';
import type { CollectorResult, NpmData } from './types.js';

interface NpmRegistry {
  name: string;
  description?: string;
  license?: string;
  repository?: { url?: string } | string;
  'dist-tags': { latest: string };
  time: Record<string, string>;
  maintainers?: Array<{ name: string }>;
  versions: Record<string, {
    dependencies?: Record<string, string>;
    deprecated?: string;
  }>;
}

function extractRepoUrl(repo: NpmRegistry['repository']): string | null {
  if (!repo) return null;
  if (typeof repo === 'string') return repo;
  const url = repo.url ?? '';
  return url.replace(/^git\+/, '').replace(/\.git$/, '') || null;
}

export async function collectNpm(pkg: string): Promise<CollectorResult<NpmData>> {
  const start = Date.now();
  try {
    const data = await httpGet<NpmRegistry>(
      `https://registry.npmjs.org/${encodeURIComponent(pkg)}`,
    );

    const latest = data['dist-tags'].latest;
    const latestMeta = data.versions[latest] ?? {};
    const publishDates = Object.entries(data.time)
      .filter(([k]) => k !== 'created' && k !== 'modified')
      .sort(([, a], [, b]) => b.localeCompare(a));
    const lastPublishDate = publishDates[0]?.[1] ?? data.time['modified'] ?? '';

    return {
      source: 'npm',
      ok: true,
      durationMs: Date.now() - start,
      data: {
        name: data.name,
        description: data.description ?? null,
        license: data.license ?? null,
        repository: extractRepoUrl(data.repository),
        latestVersion: latest,
        lastPublishDate,
        maintainers: (data.maintainers ?? []).map((m) => m.name),
        dependencies: latestMeta.dependencies ?? {},
        deprecated: latestMeta.deprecated ?? false,
      },
    };
  } catch (err) {
    return {
      source: 'npm',
      ok: false,
      error: String(err),
      durationMs: Date.now() - start,
    };
  }
}
