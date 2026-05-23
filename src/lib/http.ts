import { cacheGet, cacheSet } from './cache.js';

const DEFAULT_TIMEOUT_MS = 5000;

interface FetchOpts {
  method?: 'GET' | 'POST';
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  noCache?: boolean;
}

export async function httpGet<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  const cacheKey = `${opts.method ?? 'GET'}:${url}:${JSON.stringify(opts.body ?? '')}`;

  if (!opts.noCache) {
    const cached = cacheGet<T>(cacheKey);
    if (cached !== null) return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: opts.method ?? 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'shouldi-cli/0.1.0',
        ...opts.headers,
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as T;
    if (!opts.noCache) cacheSet(cacheKey, data);
    return data;
  } finally {
    clearTimeout(timer);
  }
}
