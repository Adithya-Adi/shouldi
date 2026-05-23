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
- **Expected invocation:** `gemini -p "<prompt>"` (unverified)

## cursor-agent

- **Status:** NOT INSTALLED on this machine
- **Expected invocation:** `cursor-agent -p "<prompt>"` (unverified)

## aider

- **Status:** NOT INSTALLED on this machine
- **Expected invocation:** `aider --message "<prompt>" --yes --no-auto-commits` (unverified)
