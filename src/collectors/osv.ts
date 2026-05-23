import { httpGet } from '../lib/http.js';
import type { CollectorResult, OsvData, OsvVuln } from './types.js';

interface OsvVulnRaw {
  id: string;
  summary?: string;
  severity?: Array<{ type: string; score: string }>;
  database_specific?: { severity?: string };
}

interface OsvResponse {
  vulns?: OsvVulnRaw[];
}

function normalizeSeverity(vuln: OsvVulnRaw): OsvVuln['severity'] {
  // Try database_specific.severity first
  const db = vuln.database_specific?.severity?.toLowerCase();
  if (db === 'critical') return 'critical';
  if (db === 'high') return 'high';
  if (db === 'moderate' || db === 'medium') return 'medium';
  if (db === 'low') return 'low';

  // Fall back to CVSS score from severity array
  for (const s of vuln.severity ?? []) {
    const score = parseFloat(s.score);
    if (!isNaN(score)) {
      if (score >= 9) return 'critical';
      if (score >= 7) return 'high';
      if (score >= 4) return 'medium';
      return 'low';
    }
  }
  return 'medium';
}

export async function collectOsv(pkg: string): Promise<CollectorResult<OsvData>> {
  const start = Date.now();
  try {
    const data = await httpGet<OsvResponse>('https://api.osv.dev/v1/query', {
      method: 'POST',
      body: { package: { name: pkg, ecosystem: 'npm' } },
      noCache: false,
    });

    const vulns: OsvVuln[] = (data.vulns ?? []).map((v) => ({
      id: v.id,
      severity: normalizeSeverity(v),
      summary: v.summary ?? v.id,
    }));

    return {
      source: 'osv',
      ok: true,
      durationMs: Date.now() - start,
      data: { vulnerabilities: vulns },
    };
  } catch (err) {
    return {
      source: 'osv',
      ok: false,
      error: String(err),
      durationMs: Date.now() - start,
    };
  }
}
