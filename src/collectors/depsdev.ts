import { httpGet } from '../lib/http.js';
import type { CollectorResult, DepsDevData } from './types.js';

interface DepsDevResponse {
  versions?: Array<{
    versionKey?: { version: string };
    isDefault?: boolean;
    publishedAt?: string;
  }>;
  scorecardV2?: {
    score?: number;
    check?: Array<{ name: string; score: number }>;
  };
}

export async function collectDepsDev(pkg: string): Promise<CollectorResult<DepsDevData>> {
  const start = Date.now();
  try {
    const data = await httpGet<DepsDevResponse>(
      `https://api.deps.dev/v3/systems/npm/packages/${encodeURIComponent(pkg)}`,
    );

    const score = data.scorecardV2?.score ?? null;

    return {
      source: 'depsdev',
      ok: true,
      durationMs: Date.now() - start,
      data: { scorecardScore: score },
    };
  } catch (err) {
    return {
      source: 'depsdev',
      ok: false,
      error: String(err),
      durationMs: Date.now() - start,
    };
  }
}
