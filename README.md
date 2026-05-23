# shouldi

AI-powered verdict on whether to install an npm package — before you install it.

```
$ shouldi install moment

✗  shouldi NOT install moment  [verdict by claude]

  Moment is self-deprecated with active high-severity vulns — use a modern alternative

  • 4 known vulns: 3 high severity (ReDoS + path traversal), unpatched in 878+ days
  • Moment team officially recommends migrating away; project is maintenance-only mode
  • 301KB minified, no tree-shaking — massive bundle cost for frontend use
  • Dormant release cadence means vulns will stay unpatched indefinitely

  Consider instead:
    ✓ date-fns      Tree-shakeable, immutable, no prototype pollution, actively maintained
    ✓ dayjs         Moment-compatible API, 2KB gzipped, drop-in for most use cases
    ✓ luxon         From Moment's own team, modern API, timezone support via Intl

  Run `shouldi why moment` for full reasoning.
```

**No API keys. No accounts. No hosted backend.**  
`shouldi` uses the AI CLI you already have — Claude Code, Ollama, Codex, Gemini, or others.

---

## Install

```bash
npm install -g should-install
```

Requires Node.js 20+.

---

## Usage

```bash
# Check a package
shouldi axios
shouldi install axios        # npm muscle memory alias

# Verbose reasoning + signals dump
shouldi why axios

# Scan all deps in current project
shouldi audit
shouldi audit --dev          # include devDependencies

# Configuration
shouldi config               # show current config
shouldi config set ai claude # switch AI adapter
shouldi config reset         # wipe config, re-run setup

# List detected AI CLIs
shouldi adapters

# Flags
shouldi axios --with ollama  # override AI for this run
shouldi axios --json         # machine-readable output
shouldi axios --no-color     # plain text
shouldi axios --timeout 120  # longer timeout (seconds)
shouldi axios --verbose      # show what's happening
```

First run: `shouldi` detects which AI CLIs you have installed and asks you to pick one.

---

## Supported AI adapters

| ID | CLI | How it's used |
|---|---|---|
| `claude` | [Claude Code](https://claude.ai/code) | `claude -p` (stdin) |
| `codex` | [OpenAI Codex CLI](https://github.com/openai/codex) | `codex exec -` (stdin) |
| `ollama` | [Ollama](https://ollama.ai) | `ollama run <model>` (stdin) |
| `gemini` | [Gemini CLI](https://ai.google.dev/gemini-api/docs/gemini-cli) | `gemini -p` |
| `cursor` | Cursor Agent | `cursor-agent -p` |
| `aider` | [aider](https://aider.chat) | `aider --message` |

Override for a single run: `shouldi <pkg> --with ollama`

Set Ollama model: `OLLAMA_MODEL=llama3.1:8b shouldi <pkg>`  
Set Codex model: `CODEX_MODEL=o3 shouldi <pkg>`

---

## How it works

```
1. Fetch signals in parallel (5s timeout each):
   npm registry · npm downloads · GitHub · Bundlephobia · OSV · deps.dev

2. Reduce to a compact Signals object

3. Build a prompt (~400 tokens) and send to your local AI CLI via stdin

4. Parse the JSON verdict, retry once on parse failure

5. Render result
```

Data sources: npm registry, GitHub REST API (unauthenticated, or set `GITHUB_TOKEN`),
Bundlephobia, OSV vulnerability database, deps.dev OpenSSF Scorecard.

Signals are cached for 24 hours at `~/.cache/shouldi/`.

---

## Privacy

`shouldi` sends package metadata to whichever AI CLI you've configured.  
That CLI's privacy policy applies. We send nothing else, anywhere.

No telemetry. No API keys stored. Cache files contain only public npm/GitHub data.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — adding a new AI adapter takes ~30 minutes.

---

## License

MIT
