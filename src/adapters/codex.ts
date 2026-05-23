import { runDetect, runCapture } from './_shared.js';
import type { AIAdapter } from './types.js';

export const codexAdapter: AIAdapter = {
  id: 'codex',
  displayName: 'OpenAI Codex CLI',
  note: 'Uses your OpenAI account via Codex CLI',

  detect() {
    return runDetect('codex', ['--version']);
  },

  invoke(prompt, { signal }) {
    const model = process.env['CODEX_MODEL'];
    const args = ['exec', '-', '--skip-git-repo-check', '--sandbox', 'read-only'];
    if (model) args.push('--model', model);
    // codex exec - reads prompt from stdin; --skip-git-repo-check avoids git requirement
    return runCapture('codex', args, { signal, adapterId: 'codex', stdin: prompt });
  },
};
