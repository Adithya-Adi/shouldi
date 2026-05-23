import { httpGet } from '../lib/http.js';
import type { CollectorResult, NpmDownloadsData } from './types.js';

interface NpmDownloadsResponse {
  downloads: number;
  package: string;
}

export async function collectNpmDownloads(
  pkg: string,
): Promise<CollectorResult<NpmDownloadsData>> {
  const start = Date.now();
  try {
    const [monthly] = await Promise.all([
      httpGet<NpmDownloadsResponse>(
        `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg)}`,
      ),
    ]);

    return {
      source: 'npmDownloads',
      ok: true,
      durationMs: Date.now() - start,
      data: {
        weeklyDownloads: Math.round(monthly.downloads / 4),
        monthlyDownloads: monthly.downloads,
      },
    };
  } catch (err) {
    return {
      source: 'npmDownloads',
      ok: false,
      error: String(err),
      durationMs: Date.now() - start,
    };
  }
}
