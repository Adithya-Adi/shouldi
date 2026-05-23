# Adapter CLI Verification Notes

Verified 2026-05-23 on Windows 11.

## claude (Claude Code)

- **Binary:** `claude`
- **Detection:** `claude --version` exits 0
- **Non-interactive flag:** `-p` / `--print`
- **Invocation:** `claude -p "<prompt>"` — prompt as positional argument
- **Output:** Plain text (markdown possible but no interactive ANSI in -p mode)
- **Notes:** Full flag list from `--help`. The `-p` flag prints response and exits.
  Prompt goes as a bare positional argument (or can be piped via stdin).

## codex (OpenAI Codex CLI)

- **Binary:** `codex`
- **Detection:** `codex --version` exits 0
- **Non-interactive subcommand:** `exec`
- **Invocation:** `codex exec "<prompt>" --skip-git-repo-check`
- **Output:** Plain text by default; `--json` outputs JSONL events
- **Notes:** `--skip-git-repo-check` required when running outside a git repo.
  `--sandbox read-only` is safest for our use case.
  Prompt can also come from stdin if `-` is used as the argument.

## ollama

- **Binary:** `ollama`
- **Detection:** `ollama --version` exits 0
- **Invocation:** `ollama run <model> "<prompt>"`
- **Output:** Plain text streaming to stdout
- **Available models on this machine:** deepseek-v4-pro:cloud, glm-5.1:cloud,
  gpt-oss:120b-cloud, qwen3-coder:480b-cloud, gpt-oss:20b, deepseek-v3.1:671b-cloud
- **Notes:** No standard llama models present. Must auto-detect first available model
  via `ollama list`. The `--format json` flag forces JSON output (useful for structured
  responses). Model is required as positional arg before the prompt.

## gemini

- **Status:** NOT INSTALLED on this machine
- **Detection:** `gemini --version` exits 0
- **Invocation:** `gemini -p "<prompt>"` — prompt as positional argument after `-p` flag
- **Notes:** Google Gemini CLI released June 2025. The `-p`/`--prompt` flag takes the
  prompt as an argument (not stdin). Output is plain text. Unverified on this machine —
  verify flag behaviour with `gemini --help` before relying on adapter.

## cursor-agent

- **Status:** NOT INSTALLED on this machine
- **Detection:** `cursor-agent --version` exits 0
- **Invocation:** `cursor-agent -p "<prompt>"` — unverified, assumed from Cursor docs
- **Notes:** Verify actual non-interactive flag when installed.

## aider

- **Status:** NOT INSTALLED on this machine
- **Detection:** `aider --version` exits 0
- **Invocation:** `aider --message "<prompt>" --yes --no-auto-commits`
- **Notes:** aider is a coding assistant designed for editing, not Q&A. Output may
  include verbose diff/patch text alongside the response. The verdict parser will
  strip non-JSON content, but aider may refuse to return JSON reliably.
  Consider `--no-git` flag to avoid git operations.

## codex (end-to-end status)

- **Detection:** Works (resolves .cmd wrapper to underlying node script)
- **End-to-end:** FAILS on this machine — ChatGPT account auth, not API key.
  Default model gpt-5.5 requires newer CLI; other models (o4-mini) unsupported
  with ChatGPT account. Set `CODEX_MODEL` env var to override model selection.
- **Workaround:** `CODEX_MODEL=o3 shouldi install <pkg> --with codex`
