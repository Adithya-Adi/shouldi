# Contributing to shouldi

## Adding a new AI adapter

Four steps:

**1. Implement `src/adapters/<id>.ts`**

```typescript
import { runDetect, runCapture } from './_shared.js';
import type { AIAdapter } from './types.js';

export const myAdapter: AIAdapter = {
  id: 'myai',
  displayName: 'My AI',
  note: 'Uses your MyAI account',

  detect() {
    return runDetect('myai', ['--version']);
  },

  invoke(prompt, { signal }) {
    // Pass prompt via stdin (preferred) or as argument to the non-interactive flag.
    // See docs/adapters.md for verified invocation patterns.
    return runCapture('myai', ['--non-interactive'], {
      signal,
      adapterId: 'myai',
      stdin: prompt,        // prompt delivered via stdin
    });
  },
};
```

**Verification required before merging.** Run the CLI manually:

```bash
# 1. Find the non-interactive flag
myai --help

# 2. Confirm it exits to shell (no TUI)
echo "say hi" | myai <flag>

# 3. Check output — plain text or ANSI/markdown?
```

Document findings in `docs/adapters.md`.

**2. Register in `src/adapters/registry.ts`**

```typescript
import { myAdapter } from './myai.js';

export const ALL_ADAPTERS: AIAdapter[] = [
  claudeAdapter,
  // ...
  myAdapter,   // add here
];
```

**3. Add to the adapter table in `README.md`**

**4. Add a snapshot test in `tests/adapters/<id>.test.ts`**

Mock `node:child_process` spawn. Verify:
- `detect()` calls the right command with `--version`
- `invoke()` passes prompt correctly (stdin or arg)
- Non-zero exit rejects with `AdapterInvocationError`

See `tests/adapters/claude.test.ts` for the pattern.

## Running tests

```bash
pnpm test          # run once
pnpm test:watch    # watch mode
```

No real network calls in CI — all tests use fixtures or mocked spawn.

## Reporting bugs

Open an issue at https://github.com/Adithya-Adi/shouldi/issues
