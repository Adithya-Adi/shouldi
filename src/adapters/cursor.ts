import { runDetect, runCapture } from './_shared.js';
import type { AIAdapter } from './types.js';

export const cursorAdapter: AIAdapter = {
  id: 'cursor',
  displayName: 'Cursor Agent',
  note: 'Uses your Cursor subscription',

  detect() {
    return runDetect('cursor-agent', ['--version']);
  },

  invoke(prompt, { signal }) {
    return runCapture('cursor-agent', ['-p', prompt], { signal, adapterId: 'cursor' });
  },
};
