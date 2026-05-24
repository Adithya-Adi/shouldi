import type { Signals } from '../signals/types.js';

const SYSTEM_PROMPT = `You are a senior software engineer giving a quick, opinionated verdict on whether to install an npm package. Be calibrated: stable-but-old is NOT the same as abandoned. Tiny packages are not automatically bad. Heuristics:

- "Done" packages (chalk, lodash) can be fine even with low recent activity.
- Single maintainer + high downloads = supply chain risk, mention it.
- Packages <30 days old need extra scrutiny (typosquatting, malicious).
- Vulnerabilities: OSV returns ALL historical CVEs including patched ones. A package with 100M+ weekly downloads and only old/fixed vulns is still likely fine — say "caution" not "no". Reserve "no" for active unpatched critical CVEs or confirmed current malicious code.
- MAL-* IDs from OSV indicate past malicious code events. If the package is canonical (100M+ downloads, years of use) and widely deployed, the MAL flag is likely historical/resolved — note it but don't auto-reject. If the package is new or obscure, treat MAL flags as hard stops.
- Bundle size matters mainly for frontend packages.

Respond with ONLY valid JSON matching this schema. No prose. No markdown fences.

{"decision":"yes"|"caution"|"no","headline":"<one sentence <100 chars>","reasons":["<2-4 items <120 chars each>"],"alternatives":[{"name":"<exact npm registry package name — all lowercase, no spaces, exactly as typed in npm install>","why":"<80 chars>"}],"confidence":"low"|"medium"|"high"}`;

export function buildPrompt(signals: Signals): string {
  const compact = JSON.stringify(signals);
  return `${SYSTEM_PROMPT}

Evaluate this npm package: ${signals.package.name}@${signals.package.version}

Signals (JSON):
${compact}

Return only the JSON verdict.`;
}
