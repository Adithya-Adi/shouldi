import { runDetect, runCapture } from './_shared.js';
import type { AIAdapter } from './types.js';

export const aiderAdapter: AIAdapter = {
  id: 'aider',
  displayName: 'Aider',
  note: 'Uses your OpenAI/Anthropic key via aider',

  detect() {
    return runDetect('aider', ['--version']);
  },

  invoke(prompt, { signal }) {
    return runCapture(
      'aider',
      ['--message', prompt, '--yes', '--no-auto-commits'],
      { signal, adapterId: 'aider' },
    );
  },
};
