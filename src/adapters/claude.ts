import { runDetect, runCapture } from './_shared.js';
import type { AIAdapter } from './types.js';

export const claudeAdapter: AIAdapter = {
  id: 'claude',
  displayName: 'Claude Code',
  note: 'Uses your existing Claude Code authentication',

  detect() {
    return runDetect('claude', ['--version']);
  },

  invoke(prompt, { signal }) {
    // claude -p reads from stdin when no prompt argument is given
    return runCapture('claude', ['-p'], { signal, adapterId: 'claude', stdin: prompt });
  },
};
