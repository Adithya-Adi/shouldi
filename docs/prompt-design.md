# Prompt Design Notes

## Calibration Run — 2026-05-23

### Test packages and verdicts

| Package | Expected | Got (v1) | Got (v2 tuned) | Notes |
|---------|----------|----------|----------------|-------|
| react | yes | caution | **yes** ✓ | v1 over-weighted historical XSS CVEs |
| moment | no | **no** ✓ | — | Correct: dormant, 4 unpatched high vulns, 878d stale |
| lodash | caution | no | **caution** ✓ | v1 over-weighted historical prototype pollution |
| chalk | caution | no | **caution** ✓ | v1 over-weighted MAL-2025-46969 (historical) |
| is-odd | caution | **caution** ✓ | — | Correct: archived, trivial impl, not worth a dep |
| axios | caution | no | — | MAL flag is historical; retested after prompt tuning |

### Key prompt iterations

**v1 (initial):**
```
Vulnerabilities matter most if they are in the package itself, not transitive.
```
Problem: OSV returns all historical CVEs. Model treated old/patched vulns and historical
MAL events with the same weight as active unpatched criticals. Over-produced "no" verdicts.

**v2 (tuned):**
Added two calibration rules:
1. OSV historical CVE guidance — packages with 100M+ downloads and only old/fixed vulns
   should get "caution" not "no". Reserve "no" for active unpatched criticals.
2. MAL-* flag guidance — canonical/widely-deployed packages with MAL flags are likely
   historical events; note but don't auto-reject. New/obscure packages: hard stop.

### Observations

- OSV database returns all historical vulns, not just current ones. This is by design
  (advisories don't get deleted) but requires the LLM to reason about whether a specific
  version is affected, not just whether the package name appears in OSV.
- MAL-* IDs (malicious code reports) are particularly tricky: they may apply to specific
  past versions that have since been yanked. The prompt must distinguish "this package
  was once compromised and patched" from "this package is currently compromised."
- The `readmeSnippet` can contain confusing version numbers (e.g. lodash README says
  "v4.18.1" as work-in-progress, not the npm-published version). LLM should trust
  `package.version` from signals over README content for the version reference.

### Prompt token count

System prompt: ~280 tokens (well under 400 token target from plan).

### Next calibration round (planned)

Test against 15 more packages spanning:
- Very new packages (<1 week old)
- Packages with only transitive vulns (not direct)
- Abandoned packages with zero vulns
- Large monorepo packages (next.js, nuxt)
- CLI tools installed globally (eslint, prettier)
