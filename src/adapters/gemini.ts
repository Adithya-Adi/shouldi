import { runDetect, runCapture } from './_shared.js';
import type { AIAdapter } from './types.js';

export const geminiAdapter: AIAdapter = {
  id: 'gemini',
  displayName: 'Gemini CLI',
  note: 'Uses your Google account via Gemini CLI',

  detect() {
    return runDetect('gemini', ['--version']);
  },

  invoke(prompt, { signal }) {
    return runCapture('gemini', ['-p', prompt], { signal, adapterId: 'gemini' });
  },
};
