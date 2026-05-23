import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';

const CACHE_DIR = join(homedir(), '.cache', 'shouldi');
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function keyToPath(key: string): string {
  const hash = createHash('sha1').update(key).digest('hex');
  return join(CACHE_DIR, `${hash}.json`);
}

export function cacheGet<T>(key: string): T | null {
  try {
    const path = keyToPath(key);
    if (!existsSync(path)) return null;
    const entry = JSON.parse(readFileSync(path, 'utf8')) as CacheEntry<T>;
    if (Date.now() - entry.ts > TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    writeFileSync(keyToPath(key), JSON.stringify(entry));
  } catch {
    // Cache write failure is non-fatal
  }
}
