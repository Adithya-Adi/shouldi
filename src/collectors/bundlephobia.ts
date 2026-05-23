import { httpGet } from '../lib/http.js';
import type { CollectorResult, BundlephobiaData } from './types.js';

interface BundlephobiaResponse {
  size: number;
  gzip: number;
  dependencyCount: number;
  hasJSModule: boolean;
  hasSideEffects: boolean | string[];
}

export async function collectBundlephobia(
  pkg: string,
): Promise<CollectorResult<BundlephobiaData>> {
  const start = Date.now();
  try {
    const data = await httpGet<BundlephobiaResponse>(
      `https://bundlephobia.com/api/size?package=${encodeURIComponent(pkg)}`,
    );

    return {
      source: 'bundlephobia',
      ok: true,
      durationMs: Date.now() - start,
      data: {
        minified: data.size,
        minifiedGzipped: data.gzip,
        dependencyCount: data.dependencyCount,
        hasTreeshaking: data.hasJSModule || data.hasSideEffects === false,
      },
    };
  } catch (err) {
    return {
      source: 'bundlephobia',
      ok: false,
      error: String(err),
      durationMs: Date.now() - start,
    };
  }
}
